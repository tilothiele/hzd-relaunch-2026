'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box, Switch, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButtonGroup, ToggleButton, Tooltip, FormControlLabel } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import MaleIcon from '@mui/icons-material/Male'
import FemaleIcon from '@mui/icons-material/Female'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_LITTERS } from '@/lib/graphql/queries'
import type { Litter, LitterSearchResult, HzdSetting, GeoLocation } from '@/types'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { MeinePlz } from '@/components/hzd-map/meine-plz'
import { theme } from '@/themes'

interface LitterSearchProps {
	strapiBaseUrl: string
	hzdSetting?: HzdSetting | null
}

type PageSize = 5 | 10 | 20

// Deutschland grobe Grenzen: Lat 47-55, Lon 5-15
const GERMANY_BOUNDS = {
	minLat: 47.0,
	maxLat: 55.0,
	minLng: 5.0,
	maxLng: 15.0,
}

/**
 * Generiert deterministische Fake-Koordinaten basierend auf der documentId
 * Dies stellt sicher, dass jeder Wurf immer die gleichen Koordinaten hat
 */
function generateFakeLocationForLitter(documentId: string): GeoLocation {
	let hash = 0
	for (let i = 0; i < documentId.length; i++) {
		const char = documentId.charCodeAt(i)
		hash = ((hash << 5) - hash) + char
		hash = hash & hash // Convert to 32bit integer
	}
	const normalizedHash = Math.abs(hash) / 2147483647
	const lat = GERMANY_BOUNDS.minLat + normalizedHash * (GERMANY_BOUNDS.maxLat - GERMANY_BOUNDS.minLat)
	const lng = GERMANY_BOUNDS.minLng + (1 - normalizedHash) * (GERMANY_BOUNDS.maxLng - GERMANY_BOUNDS.minLng)
	return { lat, lng }
}

/**
 * Berechnet die Entfernung zwischen zwei Koordinaten in Kilometern (Haversine-Formel)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371 // Erdradius in Kilometern
	const dLat = (lat2 - lat1) * Math.PI / 180
	const dLng = (lng2 - lng1) * Math.PI / 180
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

/**
 * Ermittelt die Position eines Wurfs (real oder fake)
 */
function getLitterLocation(litter: Litter): { lat: number; lng: number } {
	const breederLocation = litter.breeder?.GeoLocation
	if (breederLocation && breederLocation.lat && breederLocation.lng) {
		return { lat: breederLocation.lat, lng: breederLocation.lng }
	}
	return generateFakeLocationForLitter(litter.documentId)
}

const getStatusLabel = (status: Litter['LitterStatus']) => {
	switch (status) {
		case 'Planned': return 'Geplant'
		case 'Manted': return 'Gedeckt'
		case 'Littered': return 'Geworfen'
		case 'Closed': return 'Geschlossen'
		default: return status
	}
}

const renderStatusBadge = (status: Litter['LitterStatus'], small = false) => {
	const label = getStatusLabel(status)
	let colorClasses = 'bg-gray-100 text-gray-800'

	switch (status) {
		case 'Planned':
			colorClasses = 'bg-blue-100 text-blue-800'
			break
		case 'Manted':
			colorClasses = 'bg-yellow-100 text-yellow-800'
			break
		case 'Littered':
			colorClasses = 'bg-green-100 text-green-800'
			break
		case 'Closed':
			colorClasses = 'bg-gray-200 text-gray-700'
			break
	}

	return (
		<span className={`rounded font-medium uppercase ${colorClasses} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>
			{label}
		</span>
	)
}

export function LitterSearch({ strapiBaseUrl, hzdSetting }: LitterSearchProps) {
	const [breederFilter, setBreederFilter] = useState('')
	const [motherFilter, setMotherFilter] = useState('')
	const [statusFilter, setStatusFilter] = useState<'' | 'Planned' | 'Manted' | 'Littered' | 'Closed'>('')
	const [selectedMaleColors, setSelectedMaleColors] = useState<string[]>(['S', 'SM', 'B'])
	const [selectedFemaleColors, setSelectedFemaleColors] = useState<string[]>(['S', 'SM', 'B'])
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [litters, setLitters] = useState<Litter[]>([])
	const [showMap, setShowMap] = useState(false)
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalLitters, setTotalLitters] = useState(0)
	const [pageCount, setPageCount] = useState(0)
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
	const [isButtonHovered, setIsButtonHovered] = useState(false)

	const searchLitters = useCallback(async () => {
		if (!strapiBaseUrl) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const filterConditions: Array<Record<string, unknown>> = []

			if (breederFilter.trim()) {
				filterConditions.push({
					breeder: {
						kennelName: { containsi: breederFilter.trim() },
					},
				})
			}

			if (motherFilter.trim()) {
				filterConditions.push({
					or: [
						{ mother: { fullKennelName: { containsi: motherFilter.trim() } } },
						{ mother: { givenName: { containsi: motherFilter.trim() } } },
					],
				})
			}

			if (statusFilter) {
				filterConditions.push({
					LitterStatus: { eq: statusFilter },
				})
			}

			if (selectedMaleColors.length > 0) {
				const colorFilters = selectedMaleColors.map((color: string) => ({
					[`AmountR${color}`]: { Available: { gt: 0 } }
				}))
				filterConditions.push({ or: colorFilters })
			}

			if (selectedFemaleColors.length > 0) {
				const colorFilters = selectedFemaleColors.map((color: string) => ({
					[`AmountH${color}`]: { Available: { gt: 0 } }
				}))
				filterConditions.push({ or: colorFilters })
			}

			const variables: Record<string, unknown> = {
				pagination: {
					page,
					pageSize,
				},
				sort: ['dateOfBirth:desc', 'expectedDateOfBirth:desc'],
			}

			if (filterConditions.length > 0) {
				variables.filters = {
					and: filterConditions,
				}
			}

			const data = await fetchGraphQL<LitterSearchResult>(
				SEARCH_LITTERS,
				{
					baseUrl: strapiBaseUrl,
					variables,
				},
			)

			const littersArray = Array.isArray(data.hzdPluginLitters) ? data.hzdPluginLitters : []
			setLitters(littersArray)

			// Berechne Paginierung basierend auf den übergebenen Parametern
			// Da die Meta-Informationen nicht in der Antwort enthalten sind,
			// schätzen wir die Gesamtzahl basierend auf der Anzahl der zurückgegebenen Ergebnisse
			// Wenn wir genau pageSize Ergebnisse haben, gibt es wahrscheinlich mehr
			const estimatedTotal = littersArray.length === pageSize && page > 1
				? page * pageSize + 1
				: littersArray.length === pageSize
					? page * pageSize
					: (page - 1) * pageSize + littersArray.length

			const calculatedPageCount = Math.ceil(estimatedTotal / pageSize)

			setTotalLitters(estimatedTotal)
			setPageCount(calculatedPageCount)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Würfe konnten nicht geladen werden.')
			setError(fetchError)
			setLitters([])
			setTotalLitters(0)
			setPageCount(0)
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, breederFilter, motherFilter, statusFilter, selectedMaleColors, selectedFemaleColors, page, pageSize])

	useEffect(() => {
		void searchLitters()
	}, [searchLitters])

	const handleSearch = useCallback(() => {
		setPage(1)
		void searchLitters()
	}, [searchLitters])

	const handlePageSizeChange = useCallback((newPageSize: PageSize) => {
		setPageSize(newPageSize)
		setPage(1)
	}, [])

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage)
	}, [])

	const totalPages = pageCount
	const currentPage = page

	const formatDate = useCallback((dateString: string | null | undefined) => {
		if (!dateString) {
			return '-'
		}

		try {
			const date = new Date(dateString)
			return date.toLocaleDateString('de-DE', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			})
		} catch {
			return dateString
		}
	}, [])

	// Konvertiere Würfe in MapItems
	const mapItems = useMemo<MapItem[]>(() => litters.map((litter) => {
		const breeder = litter.breeder
		const location = getLitterLocation(litter)

		const orderLetter = litter.OrderLetter ?? ''
		const kennelName = breeder?.kennelName ?? 'Unbekannt'
		const title = `${orderLetter}-Wurf: ${kennelName}`

		return {
			id: litter.documentId,
			position: [location.lat, location.lng],
			title,
			popupContent: (
				<div>
					<strong>{title}</strong>
					{litter.dateOfBirth ? (
						<div>Geboren: {formatDate(litter.dateOfBirth)}</div>
					) : litter.expectedDateOfBirth ? (
						<div>Erwartet: {formatDate(litter.expectedDateOfBirth)}</div>
					) : null}
					<div>Status: {getStatusLabel(litter.LitterStatus)}</div>
					{breeder?.member?.zip && (
						<div>PLZ: {breeder.member.zip}</div>
					)}
				</div>
			)
		}
	}), [litters, formatDate])

	return (
		<div className='container mx-auto px-4 py-8'>
			<Box className='mb-8 rounded-lg bg-white p-6 shadow-md'>
				<h2 className='mb-6 text-2xl font-bold text-gray-900'>
					Würfe suchen
				</h2>

				<Box className='mb-6 rounded border border-gray-100 bg-gray-50/50 p-2'>
					<FormControlLabel
						control={
							<Switch
								checked={showMap}
								onChange={(e) => setShowMap(e.target.checked)}
								sx={{
									'& .MuiSwitch-switchBase.Mui-checked': {
										color: theme.submitButtonColor,
									},
									'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
										backgroundColor: theme.submitButtonColor,
									},
								}}
							/>
						}
						label='Kartenansicht'
					/>
				</Box>

				{showMap && (
					<Box sx={{ mb: 4 }}>
						<HzdMap isVisible={showMap} items={mapItems} userLocation={userLocation} height="400px" />
					</Box>
				)}

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
					<MeinePlz
						onLocationChange={setUserLocation}
						fullWidth={true}
					/>
					<TextField
						label='Züchter'
						value={breederFilter}
						onChange={(e) => setBreederFilter(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleSearch()
							}
						}}
						placeholder='Zwingername'
						fullWidth
						size='small'
					/>

					<TextField
						label='Mutter'
						value={motherFilter}
						onChange={(e) => setMotherFilter(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleSearch()
							}
						}}
						placeholder='Name der Mutter'
						fullWidth
						size='small'
					/>

					<FormControl fullWidth size='small'>
						<InputLabel>Status</InputLabel>
						<Select
							value={statusFilter}
							label='Status'
							onChange={(e) => setStatusFilter(e.target.value as any)}
						>
							<MenuItem value=''>Alle</MenuItem>
							<MenuItem value='Planned'>Geplant</MenuItem>
							<MenuItem value='Manted'>Gedeckt</MenuItem>
							<MenuItem value='Littered'>Geworfen</MenuItem>
							<MenuItem value='Closed'>Geschlossen</MenuItem>
						</Select>
					</FormControl>
				</Box>

				<Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Tooltip title="Rüden (♂)" arrow>
								<MaleIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />
							</Tooltip>
							<ToggleButtonGroup
								value={selectedMaleColors}
								onChange={(_e, newColors: string[]) => {
									setSelectedMaleColors(newColors)
									setPage(1)
								}}
								aria-label="Filter nach Rüden-Welpenfarbe"
								size="small"
								sx={{
									"& .MuiToggleButton-root": {
										px: 2,
										fontWeight: 'bold',
										"&.Mui-selected": {
											backgroundColor: theme.submitButtonColor,
											color: theme.submitButtonTextColor,
											"&:hover": {
												backgroundColor: theme.submitButtonColor,
												filter: 'brightness(90%)',
											}
										}
									}
								}}
							>
								<Tooltip title="Schwarz" arrow>
									<ToggleButton value="S">S</ToggleButton>
								</Tooltip>
								<Tooltip title="Schwarzmarken" arrow>
									<ToggleButton value="SM">SM</ToggleButton>
								</Tooltip>
								<Tooltip title="Blond" arrow>
									<ToggleButton value="B">B</ToggleButton>
								</Tooltip>
							</ToggleButtonGroup>
						</Box>

						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Tooltip title="Hündinnen (♀)" arrow>
								<FemaleIcon sx={{ color: '#ec4899', fontSize: 28 }} />
							</Tooltip>
							<ToggleButtonGroup
								value={selectedFemaleColors}
								onChange={(_e, newColors: string[]) => {
									setSelectedFemaleColors(newColors)
									setPage(1)
								}}
								aria-label="Filter nach Hündinnen-Welpenfarbe"
								size="small"
								sx={{
									"& .MuiToggleButton-root": {
										px: 2,
										fontWeight: 'bold',
										"&.Mui-selected": {
											backgroundColor: theme.submitButtonColor,
											color: theme.submitButtonTextColor,
											"&:hover": {
												backgroundColor: theme.submitButtonColor,
												filter: 'brightness(90%)',
											}
										}
									}
								}}
							>
								<Tooltip title="Schwarz" arrow>
									<ToggleButton value="S">S</ToggleButton>
								</Tooltip>
								<Tooltip title="Schwarzmarken" arrow>
									<ToggleButton value="SM">SM</ToggleButton>
								</Tooltip>
								<Tooltip title="Blond" arrow>
									<ToggleButton value="B">B</ToggleButton>
								</Tooltip>
							</ToggleButtonGroup>
						</Box>
					</Box>

					<Button
						variant='contained'
						onClick={handleSearch}
						disabled={isLoading}
						sx={{
							backgroundColor: theme.submitButtonColor,
							color: theme.submitButtonTextColor,
							filter: isButtonHovered ? 'brightness(90%)' : 'none',
							'&:hover': {
								backgroundColor: theme.submitButtonColor,
							},
							'&:disabled': {
								backgroundColor: '#d1d5db',
								color: '#9ca3af',
							},
						}}
						onMouseEnter={() => setIsButtonHovered(true)}
						onMouseLeave={() => setIsButtonHovered(false)}
					>
						{isLoading ? 'Suche...' : 'Suchen'}
					</Button>
				</Box>
			</Box>

			{error ? (
				<div className='mb-4 rounded bg-red-50 p-4 text-sm text-red-800'>
					{error.message}
				</div>
			) : null}

			<div className='mb-4 flex items-center justify-between'>
				<div className='flex items-center gap-6'>
					<div className='text-sm text-gray-600'>
						{totalLitters > 0 ? (
							<>
								Zeige {((currentPage - 1) * pageSize) + 1} bis{' '}
								{Math.min(currentPage * pageSize, totalLitters)} von {totalLitters} Würfen
							</>
						) : (
							'Keine Würfe gefunden'
						)}
					</div>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<GridViewIcon sx={{ fontSize: 20, color: viewMode === 'cards' ? theme.submitButtonColor : 'text.disabled' }} />
						<Switch
							size='small'
							checked={viewMode === 'table'}
							onChange={(e) => setViewMode(e.target.checked ? 'table' : 'cards')}
							sx={{
								'& .MuiSwitch-switchBase.Mui-checked': {
									color: theme.submitButtonColor,
								},
								'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
									backgroundColor: theme.submitButtonColor,
								},
							}}
						/>
						<TableRowsIcon sx={{ fontSize: 20, color: viewMode === 'table' ? theme.submitButtonColor : 'text.disabled' }} />
					</Box>
				</div>
				<div className='flex items-center gap-2'>
					<label
						htmlFor='page-size'
						className='text-sm text-gray-600'
					>
						Pro Seite:
					</label>
					<select
						id='page-size'
						value={pageSize}
						onChange={(e) => handlePageSizeChange(Number(e.target.value) as PageSize)}
						className='rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none'
						style={{ borderColor: 'transparent', outlineColor: theme.submitButtonColor }}
					>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={20}>20</option>
					</select>
				</div>
			</div>

			{isLoading ? (
				<div className='text-center py-8 text-gray-600'>
					Lade Würfe...
				</div>
			) : litters.length > 0 ? (
				<>
					{viewMode === 'cards' ? (
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{litters.map((litter) => {
								const orderLetter = litter.OrderLetter ?? ''
								const kennelName = litter.breeder?.kennelName ?? 'Kein Zwingername bekannt'
								const breederMember = (litter.breeder?.member?.firstName || '') + ' ' + (litter.breeder?.member?.lastName || '')
								const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
								const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName

								let distance: number | null = null
								if (userLocation) {
									const location = getLitterLocation(litter)
									if (location) {
										distance = calculateDistance(
											userLocation.lat,
											userLocation.lng,
											location.lat,
											location.lng
										)
									}
								}

								return (
									<div
										key={litter.documentId}
										className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md'
									>
										<div className='mb-3 flex items-center justify-between'>
											<h3 className='text-lg font-semibold text-gray-900'>
												{orderLetter}-Wurf: {kennelName}
											</h3>
											{renderStatusBadge(litter.LitterStatus)}
										</div>

										{/* Content Preview */}
										<div className='mb-4 flex gap-4'>
											{/* Main Image (PuppyImage or Parent Combo) */}
											<div className='relative w-1/3 aspect-[4/3] overflow-hidden rounded-md bg-gray-100 flex-shrink-0'>
												{litter.PuppyImage ? (
													<Image
														src={resolveMediaUrl(litter.PuppyImage, strapiBaseUrl) || ''}
														alt="Welpen"
														fill
														className='object-cover'
														unoptimized
													/>
												) : (
													<div className='grid grid-cols-2 h-full'>
														<div className='relative h-full border-r border-white'>
															<Image
																src={resolveMediaUrl(
																	litter.mother?.avatar ||
																	(litter.mother?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
																		litter.mother?.color === 'B' ? hzdSetting?.DefaultAvatarB :
																			hzdSetting?.DefaultAvatarS),
																	strapiBaseUrl
																) || ''}
																alt="Mutter"
																fill
																className='object-cover'
																unoptimized
															/>
														</div>
														<div className='relative h-full'>
															<Image
																src={resolveMediaUrl(
																	litter.stuntDog?.avatar ||
																	(litter.stuntDog?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
																		litter.stuntDog?.color === 'B' ? hzdSetting?.DefaultAvatarB :
																			hzdSetting?.DefaultAvatarS),
																	strapiBaseUrl
																) || ''}
																alt="Vater"
																fill
																className='object-cover'
																unoptimized
															/>
														</div>
													</div>
												)}
											</div>

											<div className='flex-1 space-y-1 text-xs text-gray-600 border-l pl-4'>
												<p><strong>Züchter:</strong> {breederMember}</p>
												{distance !== null && <p><strong>Entfernung:</strong> ~{Math.round(distance)} km</p>}
												<p><strong>Mutter:</strong> {motherName}</p>
												{stuntDogName && <p><strong>Deckrüde:</strong> {stuntDogName}</p>}
											</div>
										</div>

										<div className='space-y-2 text-sm text-gray-600'>
											{litter.dateOfManting ? (
												<p>
													<strong>Deckdatum:</strong> {formatDate(litter.dateOfManting)}
												</p>
											) : null}
											{litter.expectedDateOfBirth ? (
												<p>
													<strong>Erwartetes Geburtsdatum:</strong> {formatDate(litter.expectedDateOfBirth)}
												</p>
											) : null}
											{litter.dateOfBirth ? (
												<p>
													<strong>Geburtsdatum:</strong> {formatDate(litter.dateOfBirth)}
												</p>
											) : null}
											{(litter.AmountRS || litter.AmountRSM || litter.AmountRB || litter.AmountHS || litter.AmountHSM || litter.AmountHB) ? (
												<div className='mt-3 space-y-1 border-t border-gray-200 pt-2'>
													<div className="flex justify-between items-center mb-1">
														<p className='font-medium text-gray-700'>Welpen:</p>
														<div className="flex gap-4 text-[10px] text-gray-500 font-bold">
															<span>RUDEN (R)</span>
															<span>HÜNDINNEN (H)</span>
														</div>
													</div>

													{[
														{ key: 'S', label: 'Schwarz' },
														{ key: 'SM', label: 'Schwarzmarken' },
														{ key: 'B', label: 'Blond' }
													].map(({ key, label }) => {
														const male = (litter as any)[`AmountR${key}`]
														const female = (litter as any)[`AmountH${key}`]
														if (!male && !female) return null

														return (
															<div key={key} className="flex justify-between items-center pl-2">
																<span className="text-sm"><strong>{label}:</strong></span>
																<div className="flex gap-4 font-mono text-sm">
																	<span className={male?.Available > 0 ? 'text-green-700 font-bold' : 'text-gray-400'}>
																		{male?.Available ?? 0}/{male?.Total ?? 0}
																	</span>
																	<span className={female?.Available > 0 ? 'text-green-700 font-bold' : 'text-gray-400'}>
																		{female?.Available ?? 0}/{female?.Total ?? 0}
																	</span>
																</div>
															</div>
														)
													})}
												</div>
											) : null}
											{litter.StatusMessage ? (
												<div className='mt-3 rounded bg-blue-50 p-2'>
													<p className='text-xs font-medium text-blue-800'>Status:</p>
													<p className='text-xs text-blue-700'>{litter.StatusMessage}</p>
												</div>
											) : null}
										</div>
									</div>
								)
							})}
						</div>
					) : (
						<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
							<Table size="small">
								<TableHead sx={{ backgroundColor: '#f9fafb' }}>
									<TableRow>
										<TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Wurf-Nr.</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Züchter</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Entfernung</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Mutter</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Deckrüde</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Erw. Geb. Datum</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Geburtsdatum</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">S (R / H)</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">SM (R / H)</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">B (R / H)</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{litters.map((litter) => {
										const orderLetter = litter.OrderLetter ?? ''
										const kennelName = litter.breeder?.kennelName ?? 'Kein Zwingername bekannt'
										const breederMember = (litter.breeder?.member?.firstName || '') + ' ' + (litter.breeder?.member?.lastName || '')
										const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
										const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName ?? '-'

										let distance: number | null = null
										if (userLocation) {
											const location = getLitterLocation(litter)
											distance = calculateDistance(
												userLocation.lat,
												userLocation.lng,
												location.lat,
												location.lng
											)
										}

										return (
											<TableRow key={litter.documentId} hover>
												<TableCell>
													{renderStatusBadge(litter.LitterStatus, true)}
												</TableCell>
												<TableCell>{orderLetter}</TableCell>
												<TableCell>
													<div className="font-medium text-gray-900">{kennelName}</div>
													<div className="text-xs text-gray-500">{breederMember}</div>
												</TableCell>
												<TableCell>
													{distance !== null ? `~${Math.round(distance)} km` : '-'}
												</TableCell>
												<TableCell>{motherName}</TableCell>
												<TableCell>{stuntDogName}</TableCell>
												<TableCell>{formatDate(litter.expectedDateOfBirth)}</TableCell>
												<TableCell>{formatDate(litter.dateOfBirth)}</TableCell>
												<TableCell align="center">
													<div className="flex justify-center gap-2 text-xs">
														<span className={litter.AmountRS?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountRS ? `${litter.AmountRS.Available ?? 0}/${litter.AmountRS.Total ?? 0}` : '-'}</span>
														<span className="text-gray-300">|</span>
														<span className={litter.AmountHS?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountHS ? `${litter.AmountHS.Available ?? 0}/${litter.AmountHS.Total ?? 0}` : '-'}</span>
													</div>
												</TableCell>
												<TableCell align="center">
													<div className="flex justify-center gap-2 text-xs">
														<span className={litter.AmountRSM?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountRSM ? `${litter.AmountRSM.Available ?? 0}/${litter.AmountRSM.Total ?? 0}` : '-'}</span>
														<span className="text-gray-300">|</span>
														<span className={litter.AmountHSM?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountHSM ? `${litter.AmountHSM.Available ?? 0}/${litter.AmountHSM.Total ?? 0}` : '-'}</span>
													</div>
												</TableCell>
												<TableCell align="center">
													<div className="flex justify-center gap-2 text-xs">
														<span className={litter.AmountRB?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountRB ? `${litter.AmountRB.Available ?? 0}/${litter.AmountRB.Total ?? 0}` : '-'}</span>
														<span className="text-gray-300">|</span>
														<span className={litter.AmountHB?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountHB ? `${litter.AmountHB.Available ?? 0}/${litter.AmountHB.Total ?? 0}` : '-'}</span>
													</div>
												</TableCell>
											</TableRow>
										)
									})}
								</TableBody>
							</Table>
						</TableContainer>
					)}

					{totalPages > 1 ? (
						<div className='mt-6 flex items-center justify-center gap-2'>
							<button
								type='button'
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1 || isLoading}
								className='rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
							>
								Zurück
							</button>
							<span className='text-sm text-gray-600'>
								Seite {currentPage} von {totalPages}
							</span>
							<button
								type='button'
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages || isLoading}
								className='rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
							>
								Weiter
							</button>
						</div>
					) : null}
				</>
			) : !isLoading ? (
				<div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600'>
					Keine Würfe gefunden. Bitte passen Sie Ihre Suchkriterien an.
				</div>
			) : null}
		</div>
	)
}


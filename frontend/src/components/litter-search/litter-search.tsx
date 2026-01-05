'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box, Switch, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButtonGroup, ToggleButton, Tooltip, FormControlLabel } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_LITTERS } from '@/lib/graphql/queries'
import type { Litter, LitterSearchResult, HzdSetting, GeoLocation } from '@/types'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { MeinePlz } from '@/components/hzd-map/meine-plz'

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

export function LitterSearch({ strapiBaseUrl, hzdSetting }: LitterSearchProps) {
	const [breederFilter, setBreederFilter] = useState('')
	const [motherFilter, setMotherFilter] = useState('')
	const [closedFilter, setClosedFilter] = useState<'' | 'true' | 'false'>('')
	const [selectedColors, setSelectedColors] = useState<string[]>(['S', 'SM', 'B'])
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

			if (closedFilter) {
				filterConditions.push({
					closed: closedFilter === 'true' ? { eq: true } : { ne: true },
				})
			}

			if (selectedColors.length > 0) {
				const colorFilters = selectedColors.map(color => ({
					[`Amount${color}`]: { Available: { gt: 0 } }
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
	}, [strapiBaseUrl, breederFilter, motherFilter, closedFilter, selectedColors, page, pageSize])

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
		let location = breeder?.GeoLocation

		if (!location || !location.lat || !location.lng) {
			location = generateFakeLocationForLitter(litter.documentId)
		}

		const orderLetter = litter.OrderLetter ?? ''
		const kennelName = breeder?.kennelName ?? 'Unbekannt'
		const title = `${orderLetter}-Wurf: ${kennelName}`

		return {
			id: litter.documentId,
			position: [location.lat!, location.lng!],
			title,
			popupContent: (
				<div>
					<strong>{title}</strong>
					{litter.dateOfBirth ? (
						<div>Geboren: {formatDate(litter.dateOfBirth)}</div>
					) : litter.expectedDateOfBirth ? (
						<div>Erwartet: {formatDate(litter.expectedDateOfBirth)}</div>
					) : null}
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
										color: '#facc15',
									},
									'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
										backgroundColor: '#facc15',
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
							value={closedFilter}
							label='Status'
							onChange={(e) => setClosedFilter(e.target.value as '' | 'true' | 'false')}
						>
							<MenuItem value=''>Alle</MenuItem>
							<MenuItem value='false'>Offen</MenuItem>
							<MenuItem value='true'>Geschlossen</MenuItem>
						</Select>
					</FormControl>
				</Box>

				<Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
						<Typography variant="body2" sx={{ fontWeight: 500, mr: 1 }}>Verfügbare Welpen in den Farbschlägen:</Typography>
						<ToggleButtonGroup
							value={selectedColors}
							onChange={(_e, newColors: string[]) => {
								setSelectedColors(newColors)
								setPage(1)
							}}
							aria-label="Filter nach Welpenfarbe"
							size="small"
							sx={{
								"& .MuiToggleButton-root": {
									px: 3,
									fontWeight: 'bold',
									"&.Mui-selected": {
										backgroundColor: '#facc15',
										color: '#565757',
										"&:hover": {
											backgroundColor: '#e6b800',
										}
									}
								}
							}}
						>
							<Tooltip title="Schwarz" arrow>
								<ToggleButton value="S" aria-label="Schwarz">S</ToggleButton>
							</Tooltip>
							<Tooltip title="Schwarzmarken" arrow>
								<ToggleButton value="SM" aria-label="Schwarzmarken">SM</ToggleButton>
							</Tooltip>
							<Tooltip title="Blond" arrow>
								<ToggleButton value="B" aria-label="Blond">B</ToggleButton>
							</Tooltip>
						</ToggleButtonGroup>
					</Box>

					<Button
						variant='contained'
						onClick={handleSearch}
						disabled={isLoading}
						sx={{
							backgroundColor: '#facc15',
							color: '#565757',
							'&:hover': {
								backgroundColor: '#e6b800',
							},
							'&:disabled': {
								backgroundColor: '#d1d5db',
								color: '#9ca3af',
							},
						}}
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
						<GridViewIcon sx={{ fontSize: 20, color: viewMode === 'cards' ? '#facc15' : 'text.disabled' }} />
						<Switch
							size='small'
							checked={viewMode === 'table'}
							onChange={(e) => setViewMode(e.target.checked ? 'table' : 'cards')}
							sx={{
								'& .MuiSwitch-switchBase.Mui-checked': {
									color: '#facc15',
								},
								'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
									backgroundColor: '#facc15',
								},
							}}
						/>
						<TableRowsIcon sx={{ fontSize: 20, color: viewMode === 'table' ? '#facc15' : 'text.disabled' }} />
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
						className='rounded border border-gray-300 px-2 py-1 text-sm focus:border-yellow-400 focus:outline-none'
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

								return (
									<div
										key={litter.documentId}
										className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md'
									>
										<div className='mb-3 flex items-center justify-between'>
											<h3 className='text-lg font-semibold text-gray-900'>
												{orderLetter}-Wurf: {kennelName}
											</h3>
											{litter.closed ? (
												<span className='rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700'>
													Geschlossen
												</span>
											) : (
												<span className='rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800'>
													Offen
												</span>
											)}
										</div>

										{/* Parent Images */}
										<div className='mb-4 grid grid-cols-2 gap-2'>
											<div className='relative aspect-square overflow-hidden rounded-md bg-gray-100'>
												{litter.mother?.avatar || hzdSetting ? (
													<Image
														src={resolveMediaUrl(
															litter.mother?.avatar ||
															(litter.mother?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
																litter.mother?.color === 'B' ? hzdSetting?.DefaultAvatarB :
																	hzdSetting?.DefaultAvatarS),
															strapiBaseUrl
														) || ''}
														alt={litter.mother?.fullKennelName || 'Mutter'}
														fill
														className='object-cover'
														unoptimized
													/>
												) : (
													<div className='flex h-full items-center justify-center text-[10px] text-gray-400'>
														Kein Bild (Mutter)
													</div>
												)}
											</div>
											<div className='relative aspect-square overflow-hidden rounded-md bg-gray-100'>
												{litter.stuntDog?.avatar || hzdSetting ? (
													<Image
														src={resolveMediaUrl(
															litter.stuntDog?.avatar ||
															(litter.stuntDog?.color === 'SM' ? hzdSetting?.DefaultAvatarSM :
																litter.stuntDog?.color === 'B' ? hzdSetting?.DefaultAvatarB :
																	hzdSetting?.DefaultAvatarS),
															strapiBaseUrl
														) || ''}
														alt={litter.stuntDog?.fullKennelName || 'Deckrüde'}
														fill
														className='object-cover'
														unoptimized
													/>
												) : (
													<div className='flex h-full items-center justify-center text-[10px] text-gray-400'>
														Kein Bild (Deckrüde)
													</div>
												)}
											</div>
										</div>

										<div className='space-y-2 text-sm text-gray-600'>
											<p>
												<strong>Züchter:</strong> {breederMember}
											</p>
											<p>
												<strong>Mutter:</strong> {motherName}
											</p>
											{stuntDogName ? (
												<p>
													<strong>Deckrüde:</strong> {stuntDogName}
												</p>
											) : null}
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
											{(litter.AmountS || litter.AmountSM || litter.AmountB) ? (
												<div className='mt-3 space-y-1 border-t border-gray-200 pt-2'>
													<p className='font-medium text-gray-700'>Welpen:</p>
													{litter.AmountS ? (
														<p className='pl-2'>
															<strong>Schwarz:</strong> {litter.AmountS.Available ?? 0}/{litter.AmountS.Total ?? 0} verfügbar
														</p>
													) : null}
													{litter.AmountSM ? (
														<p className='pl-2'>
															<strong>Schwarzmarken:</strong> {litter.AmountSM.Available ?? 0}/{litter.AmountSM.Total ?? 0} verfügbar
														</p>
													) : null}
													{litter.AmountB ? (
														<p className='pl-2'>
															<strong>Blond:</strong> {litter.AmountB.Available ?? 0}/{litter.AmountB.Total ?? 0} verfügbar
														</p>
													) : null}
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
										<TableCell sx={{ fontWeight: 'bold' }}>Mutter</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Deckrüde</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Erw. Geb. Datum</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Geburtsdatum</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">S (V/T)</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">SM (V/T)</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">B (V/T)</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{litters.map((litter) => {
										const orderLetter = litter.OrderLetter ?? ''
										const kennelName = litter.breeder?.kennelName ?? 'Kein Zwingername bekannt'
										const breederMember = (litter.breeder?.member?.firstName || '') + ' ' + (litter.breeder?.member?.lastName || '')
										const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
										const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName ?? '-'

										return (
											<TableRow key={litter.documentId} hover>
												<TableCell>
													{litter.closed ? (
														<span className='rounded bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-700 uppercase'>Geschl.</span>
													) : (
														<span className='rounded bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800 uppercase'>Offen</span>
													)}
												</TableCell>
												<TableCell>{orderLetter}</TableCell>
												<TableCell>
													<div className="font-medium text-gray-900">{kennelName}</div>
													<div className="text-xs text-gray-500">{breederMember}</div>
												</TableCell>
												<TableCell>{motherName}</TableCell>
												<TableCell>{stuntDogName}</TableCell>
												<TableCell>{formatDate(litter.expectedDateOfBirth)}</TableCell>
												<TableCell>{formatDate(litter.dateOfBirth)}</TableCell>
												<TableCell align="center">
													{litter.AmountS ? `${litter.AmountS.Available ?? 0}/${litter.AmountS.Total ?? 0}` : '-'}
												</TableCell>
												<TableCell align="center">
													{litter.AmountSM ? `${litter.AmountSM.Available ?? 0}/${litter.AmountSM.Total ?? 0}` : '-'}
												</TableCell>
												<TableCell align="center">
													{litter.AmountB ? `${litter.AmountB.Available ?? 0}/${litter.AmountB.Total ?? 0}` : '-'}
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


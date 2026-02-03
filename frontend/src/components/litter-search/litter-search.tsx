'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box, Switch, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButtonGroup, ToggleButton, Tooltip, FormControlLabel } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import MaleIcon from '@mui/icons-material/Male'
import FemaleIcon from '@mui/icons-material/Female'

import type { Litter, HzdSetting, GeoLocation } from '@/types'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { MeinePlz } from '@/components/hzd-map/meine-plz'
import { theme } from '@/themes'
import { LitterCard } from '@/components/litter-search/litter-card'
import { LitterDetailsModal } from '@/components/litter-search/litter-details-modal'
import { useLitters, type LitterStatus, type PageSize } from '@/hooks/use-litters'

interface LitterSearchProps {
	strapiBaseUrl: string
	hzdSetting?: HzdSetting | null
}



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
	const [statusFilter, setStatusFilter] = useState<LitterStatus>('')
	const [orderLetterFilter, setOrderLetterFilter] = useState('')
	const [selectedMaleColors, setSelectedMaleColors] = useState<string[]>(['S', 'SM', 'B'])
	const [selectedFemaleColors, setSelectedFemaleColors] = useState<string[]>(['S', 'SM', 'B'])
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [selectedLitter, setSelectedLitter] = useState<Litter | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [showMap, setShowMap] = useState(false)
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
	const [isButtonHovered, setIsButtonHovered] = useState(false)

	const filters = useMemo(() => ({
		breederFilter,
		motherFilter,
		statusFilter,
		orderLetterFilter,
		selectedMaleColors,
		selectedFemaleColors,
	}), [breederFilter, motherFilter, statusFilter, orderLetterFilter, selectedMaleColors, selectedFemaleColors])

	const {
		litters,
		totalLitters,
		pageCount,
		isLoading,
		error,
		searchLitters,
	} = useLitters({
		filters,
		pagination: {
			page,
			pageSize,
		},
		autoLoad: false,
	})



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
		<>
			<div className='container mx-auto px-4 py-8'>
				<Box className='mb-8 rounded-lg bg-white p-6 shadow-md'>
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
							<Box sx={{ mt: 2, width: { xs: '100%', md: '300px' } }}>
								<MeinePlz
									onLocationChange={setUserLocation}
									fullWidth={true}
								/>
							</Box>
						</Box>
					)}

					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>

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

						<FormControl fullWidth size='small'>
							<InputLabel>Wurf</InputLabel>
							<Select
								value={orderLetterFilter}
								label='Wurf'
								onChange={(e) => setOrderLetterFilter(e.target.value)}
							>
								<MenuItem value=''>Alle</MenuItem>
								{Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
									<MenuItem key={letter} value={letter}>{letter}-Wurf</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					<Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', opacity: statusFilter === 'Littered' ? 1 : 0.5, pointerEvents: statusFilter === 'Littered' ? 'auto' : 'none' }}>
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
									disabled={statusFilter !== 'Littered'}
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
									disabled={statusFilter !== 'Littered'}
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
								borderRadius: '999px',
								'&:hover': {
									backgroundColor: theme.buttonHoverColor,
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
							<option value={50}>50</option>
							<option value={100}>100</option>
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
										<LitterCard
											key={litter.documentId}
											litter={litter}
											strapiBaseUrl={strapiBaseUrl}
											hzdSetting={hzdSetting}
											distance={distance}
											formatDate={formatDate}
											onClick={() => {
												setSelectedLitter(litter)
												setIsModalOpen(true)
											}}
										/>
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
											<TableCell sx={{ fontWeight: 'bold' }}>Zwinger</TableCell>
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
												<TableRow
													key={litter.documentId}
													hover
													onClick={() => {
														setSelectedLitter(litter)
														setIsModalOpen(true)
													}}
													sx={{ cursor: 'pointer' }}
												>
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
				) : null
				}
			</div >

			<LitterDetailsModal
				litter={selectedLitter}
				strapiBaseUrl={strapiBaseUrl}
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				hzdSetting={hzdSetting}
				distance={selectedLitter && userLocation ? (() => {
					const location = getLitterLocation(selectedLitter)
					if (location) {
						return calculateDistance(
							userLocation.lat,
							userLocation.lng,
							location.lat,
							location.lng
						)
					}
					return null
				})() : null}
				formatDate={formatDate}
			/>
			)
		</>
	)
}


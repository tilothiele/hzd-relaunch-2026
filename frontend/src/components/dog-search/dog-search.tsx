'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box, Switch, FormControlLabel, Chip, OutlinedInput, Pagination, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import MaleIcon from '@mui/icons-material/Male'
import FemaleIcon from '@mui/icons-material/Female'
import { useDogs, type ColorFilter, type PageSize, type SexFilter, type DistanceFilter } from '@/hooks/use-dogs'
import { MeinePlz } from '@/components/hzd-map/meine-plz'
import { theme } from '@/themes'

import { DogCard } from './dog-card'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { DogDetailModal } from './dog-detail-modal'
import type { Dog, GeoLocation, HzdSetting } from '@/types'

// Deutschland grobe Grenzen: Lat 47-55, Lon 5-15
const GERMANY_BOUNDS = {
	minLat: 47.0,
	maxLat: 55.0,
	minLng: 5.0,
	maxLng: 15.0,
}

import { calculateAge, formatDate } from '@/lib/date-utils'

import { calculateDistance } from '@/lib/geo-utils'

function getColorLabel(color: string | null | undefined): string {
	switch (color) {
		case 'S': return 'Schwarz'
		case 'SM': return 'Schwarzmarken'
		case 'B': return 'Blond'
		default: return '-'
	}
}

/**
 * Generiert deterministische Fake-Koordinaten basierend auf der documentId
 * Dies stellt sicher, dass jeder Hund immer die gleichen Koordinaten hat
 */
function generateFakeLocationForDog(documentId: string): GeoLocation {
	// Verwende einen einfachen Hash der documentId, um deterministische Werte zu erhalten
	let hash = 0
	for (let i = 0; i < documentId.length; i++) {
		const char = documentId.charCodeAt(i)
		hash = ((hash << 5) - hash) + char
		hash = hash & hash // Convert to 32bit integer
	}

	// Normalisiere den Hash auf 0-1 Bereich
	const normalizedHash = Math.abs(hash) / 2147483647

	// Generiere Koordinaten innerhalb Deutschlands
	const lat = GERMANY_BOUNDS.minLat + normalizedHash * (GERMANY_BOUNDS.maxLat - GERMANY_BOUNDS.minLat)
	const lng = GERMANY_BOUNDS.minLng + (1 - normalizedHash) * (GERMANY_BOUNDS.maxLng - GERMANY_BOUNDS.minLng)

	return { lat, lng }
}

/**
 * Erweitert Hunde mit Fake-Koordinaten, wenn keine Location vorhanden ist
 */
function enrichDogsWithFakeLocations(dogs: Dog[]): Dog[] {
	return dogs.map((dog) => {
		if (!dog.Location) {
			return {
				...dog,
				Location: generateFakeLocationForDog(dog.documentId),
			}
		}
		return dog
	})
}

interface DogSearchProps {
	strapiBaseUrl?: string | null
	sexFilter: SexFilter
	hzdSetting?: HzdSetting | null
}

export function DogSearch({ strapiBaseUrl, sexFilter, hzdSetting }: DogSearchProps) {
	const [nameFilter, setNameFilter] = useState('')
	const [colorFilter, setColorFilter] = useState<ColorFilter>('')
	const [chipNoFilter, setChipNoFilter] = useState('')
	const [zipCode, setZipCode] = useState('')
	const [zipLocation, setZipLocation] = useState<{ lat: number; lng: number } | null>(null)
	const [maxDistance, setMaxDistance] = useState<DistanceFilter>('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [showMap, setShowMap] = useState(false)
	const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
	const [isButtonHovered, setIsButtonHovered] = useState(false)

	const userLocation = zipLocation || null
	const isLocationAvailable = !!userLocation


	const filters = useMemo(() => ({
		nameFilter,
		sexFilter,
		colorFilter,
		chipNoFilter,
		maxDistance: maxDistance === '' ? undefined : maxDistance,
		userLocation: userLocation || undefined,
	}), [nameFilter, sexFilter, colorFilter, chipNoFilter, maxDistance, userLocation])

	const {
		dogs,
		totalDogs,
		pageCount,
		isLoading,
		error,
		searchDogs,
	} = useDogs({
		filters,
		pagination: {
			page,
			pageSize,
		},
		autoLoad: false,
	})

	const handleSearch = useCallback(() => {
		setPage(1)
		setHasSearched(true)
		void searchDogs()
	}, [searchDogs])

	const handlePageSizeChange = useCallback((newPageSize: PageSize) => {
		setPageSize(newPageSize)
		setPage(1)
	}, [])

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage)
	}, [])

	const handleDogImageClick = useCallback((dog: Dog) => {
		setSelectedDog(dog)
		setIsModalOpen(true)
	}, [])

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false)
		setSelectedDog(null)
	}, [])

	// Erweitere Hunde mit Fake-Koordinaten, wenn keine Location vorhanden ist
	const enrichedDogs = useMemo(() => enrichDogsWithFakeLocations(dogs), [dogs])

	useEffect(() => {
		if (hasSearched && page > 0) {
			void searchDogs()
		}
	}, [page, hasSearched, searchDogs])

	// Konvertiere Hunde in MapItems
	const mapItems = useMemo<MapItem[]>(() => enrichedDogs.map((dog) => ({
		id: dog.documentId,
		position: [dog.Location!.lat!, dog.Location!.lng!],
		title: dog.fullKennelName ?? dog.givenName ?? 'Unbekannt',
		popupContent: (
			<div>
				<strong>{dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'}</strong>
				{dog.givenName && dog.fullKennelName ? (
					<div>{dog.givenName}</div>
				) : null}
			</div>
		)
	})), [enrichedDogs])

	const totalPages = pageCount
	const currentPage = page

	return (
		<div className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div id='dog-suchmaske' className='grid w-full max-w-6xl gap-6'>
				{/* Karten-Toggle */}
				<Box className='rounded-lg bg-white p-4 shadow-md'>
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
						label='Karte anzeigen'
					/>
				</Box>

				{/* Karte */}
				<HzdMap isVisible={showMap} items={mapItems} userLocation={zipLocation} />

				{showMap && (
					<Box sx={{ mb: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
						<MeinePlz
							initialZip={zipCode}
							onZipChange={setZipCode}
							onLocationChange={setZipLocation}
						/>
						<FormControl fullWidth size='small' disabled={!isLocationAvailable}>
							<InputLabel>Maximale Entfernung</InputLabel>
							<Select
								value={maxDistance === '' ? '' : String(maxDistance)}
								label='Maximale Entfernung'
								onChange={(e) => {
									const value = e.target.value
									if (value === '') {
										setMaxDistance('')
									} else {
										const numValue = Number(value)
										if (!isNaN(numValue) && (numValue === 50 || numValue === 100 || numValue === 300 || numValue === 800)) {
											setMaxDistance(numValue as DistanceFilter)
										}
									}
								}}
							>
								<MenuItem value=''>-</MenuItem>
								<MenuItem value='50'>50 km</MenuItem>
								<MenuItem value='100'>100 km</MenuItem>
								<MenuItem value='300'>300 km</MenuItem>
								<MenuItem value='800'>800 km</MenuItem>
							</Select>
						</FormControl>
					</Box>
				)}
				<Box className='rounded-lg bg-white p-4 shadow-md'>
					{/* Erste Zeile: Name, Farbe, Chipnummer */}
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
						<TextField
							label='Name'
							value={nameFilter}
							onChange={(e) => setNameFilter(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleSearch()
								}
							}}
							placeholder='Name oder Zuchtname'
							fullWidth
							size='small'
						/>

						<FormControl fullWidth size='small'>
							<InputLabel>Farbe</InputLabel>
							<Select
								value={colorFilter}
								label='Farbe'
								onChange={(e) => setColorFilter(e.target.value as ColorFilter)}
							>
								<MenuItem value=''>Alle</MenuItem>
								<MenuItem value='S'>Schwarz</MenuItem>
								<MenuItem value='SM'>Schwarzmarken</MenuItem>
								<MenuItem value='B'>Blond</MenuItem>
							</Select>
						</FormControl>

						<TextField
							label='Chipnummer'
							value={chipNoFilter}
							onChange={(e) => setChipNoFilter(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleSearch()
								}
							}}
							placeholder='Chipnummer'
							fullWidth
							size='small'
						/>
					</Box>



					<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
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
					<div className='rounded bg-red-50 p-4 text-sm text-red-800'>
						{error.message}
					</div>
				) : null}

				<div className='flex items-center justify-between'>
					<div className='text-sm text-gray-600'>
						{totalDogs > 0 ? (
							<>
								Zeige {((currentPage - 1) * pageSize) + 1} bis{' '}
								{Math.min(currentPage * pageSize, totalDogs)} von {totalDogs} Hunden
							</>
						) : (
							'Keine Hunde gefunden'
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
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{Array.from({ length: pageSize }).map((_, index) => (
							<div
								key={`skeleton-${index}`}
								className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
							>
								<div className='mb-3 h-48 w-full animate-pulse rounded bg-gray-200' />
								<div className='space-y-3'>
									<div className='h-4 w-3/4 animate-pulse rounded bg-gray-200' />
									<div className='h-4 w-1/2 animate-pulse rounded bg-gray-200' />
									<div className='h-4 w-2/3 animate-pulse rounded bg-gray-200' />
									<div className='h-4 w-1/3 animate-pulse rounded bg-gray-200' />
									<div className='h-4 w-1/2 animate-pulse rounded bg-gray-200' />
								</div>
							</div>
						))}
					</div>
				) : enrichedDogs.length > 0 ? (
					<>
						{totalPages > 1 ? (
							<Box className='mb-6 flex items-center justify-center'>
								<Pagination
									count={totalPages}
									page={currentPage}
									onChange={(_, value) => handlePageChange(value)}
									disabled={isLoading}
									color='primary'
									showFirstButton
									showLastButton
									sx={{
										'& .MuiPaginationItem-root': {
											fontSize: '0.875rem',
										},
										'& .MuiPaginationItem-page.Mui-selected': {
											backgroundColor: theme.submitButtonColor,
											color: theme.submitButtonTextColor,
											'&:hover': {
												backgroundColor: theme.submitButtonColor,
												filter: 'brightness(90%)',
											},
										},
										'& .MuiPaginationItem-root.Mui-disabled': {
											opacity: 0.5,
										},
									}}
								/>
							</Box>
						) : null}
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{viewMode === 'cards' ? (
								enrichedDogs.map((dog) => (
									<DogCard
										key={dog.documentId}
										dog={dog}
										strapiBaseUrl={strapiBaseUrl}
										onImageClick={() => handleDogImageClick(dog)}
										userLocation={userLocation}
										maxDistance={maxDistance === '' ? undefined : maxDistance}
										hzdSetting={hzdSetting}
									/>
								))
							) : (
								<div className="col-span-full">
									<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
										<Table size="small">
											<TableHead sx={{ backgroundColor: '#f9fafb' }}>
												<TableRow>
													<TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
													<TableCell sx={{ fontWeight: 'bold' }}>Geschlecht</TableCell>
													<TableCell sx={{ fontWeight: 'bold' }}>Wurftag/Alter</TableCell>
													<TableCell sx={{ fontWeight: 'bold' }}>Farbe</TableCell>
													<TableCell sx={{ fontWeight: 'bold' }}>Entfernung</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{enrichedDogs.map((dog) => {
													let distance: number | null = null
													if (userLocation && dog.Location && typeof dog.Location.lat === 'number' && typeof dog.Location.lng === 'number') {
														distance = calculateDistance(
															userLocation.lat,
															userLocation.lng,
															dog.Location.lat,
															dog.Location.lng,
														)
													}

													const age = calculateAge(dog.dateOfBirth)

													return (
														<TableRow
															key={dog.documentId}
															hover
															onClick={() => handleDogImageClick(dog)}
															sx={{ cursor: 'pointer' }}
														>
															<TableCell>
																<div className="font-medium text-gray-900">{dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'}</div>
																{dog.fullKennelName && dog.givenName && (
																	<div className="text-xs text-gray-500">{dog.givenName}</div>
																)}
															</TableCell>
															<TableCell>
																{dog.sex === 'M' ? (
																	<Tooltip title="Rüde">
																		<MaleIcon sx={{ color: '#0ea5e9' }} />
																	</Tooltip>
																) : dog.sex === 'F' ? (
																	<Tooltip title="Hündin">
																		<FemaleIcon sx={{ color: '#ec4899' }} />
																	</Tooltip>
																) : '-'}
															</TableCell>
															<TableCell>
																{formatDate(dog.dateOfBirth)}
																{age && <span className="text-gray-500 ml-1 text-xs">{age}</span>}
															</TableCell>
															<TableCell>{getColorLabel(dog.color)}</TableCell>
															<TableCell>
																{distance !== null ? `~${Math.round(distance)} km` : '-'}
															</TableCell>
														</TableRow>
													)
												})}
											</TableBody>
										</Table>
									</TableContainer>
								</div>
							)}
						</div>

						{totalPages > 1 ? (
							<Box className='mt-6 flex items-center justify-center'>
								<Pagination
									count={totalPages}
									page={currentPage}
									onChange={(_, value) => handlePageChange(value)}
									disabled={isLoading}
									color='primary'
									showFirstButton
									showLastButton
									sx={{
										'& .MuiPaginationItem-root': {
											fontSize: '0.875rem',
										},
										'& .MuiPaginationItem-page.Mui-selected': {
											backgroundColor: theme.submitButtonColor,
											color: theme.submitButtonTextColor,
											'&:hover': {
												backgroundColor: theme.submitButtonColor,
												filter: 'brightness(90%)',
											},
										},
										'& .MuiPaginationItem-root.Mui-disabled': {
											opacity: 0.5,
										},
									}}
								/>
							</Box>
						) : null}
					</>
				) : !isLoading ? (
					<div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600'>
						Keine Hunde gefunden. Bitte passen Sie Ihre Suchkriterien an.
					</div>
				) : null}
			</div>

			{/* Dog Detail Modal */}
			<DogDetailModal
				dog={selectedDog}
				strapiBaseUrl={strapiBaseUrl}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				hzdSetting={hzdSetting}
			/>
		</div>
	)
}


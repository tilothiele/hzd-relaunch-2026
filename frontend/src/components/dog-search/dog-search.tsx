'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box, Switch, FormControlLabel, Chip, OutlinedInput, Pagination } from '@mui/material'
import { useDogs, type ColorFilter, type PageSize, type SexFilter, type Sod1Filter, type HDFilter, type DistanceFilter } from '@/hooks/use-dogs'
import { useGeolocation } from '@/hooks/use-geolocation'

type ExaminationFilter = 'HD' | 'HeartCheck' | 'Genprofil' | 'EyesCheck' | 'ColorCheck'
import { DogCard } from './dog-card'
import { DogMap } from './dog-map'
import { DogDetailModal } from './dog-detail-modal'
import type { Dog, GeoLocation } from '@/types'

// Deutschland grobe Grenzen: Lat 47-55, Lon 5-15
const GERMANY_BOUNDS = {
	minLat: 47.0,
	maxLat: 55.0,
	minLng: 5.0,
	maxLng: 15.0,
}

/**
 * Konvertiert SOD1-Wert von Schema-Format (N_N) zu Anzeige-Format (N/N)
 */
function formatSod1ForDisplay(sod1: string | null | undefined): string {
	if (!sod1) {
		return ''
	}
	return sod1.replace(/_/g, '/')
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
}

export function DogSearch({ strapiBaseUrl, sexFilter }: DogSearchProps) {
	const [nameFilter, setNameFilter] = useState('')
	const [colorFilter, setColorFilter] = useState<ColorFilter>('')
	const [chipNoFilter, setChipNoFilter] = useState('')
	const [sod1Filters, setSod1Filters] = useState<Sod1Filter[]>([])
	const [hdFilters, setHdFilters] = useState<HDFilter[]>([])
	const [examinationFilters, setExaminationFilters] = useState<ExaminationFilter[]>([])
	const [zipCode, setZipCode] = useState('')
	const [zipLocation, setZipLocation] = useState<{ lat: number; lng: number } | null>(null)
	const [isGeocodingZip, setIsGeocodingZip] = useState(false)
	const [maxDistance, setMaxDistance] = useState<DistanceFilter>('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [showMap, setShowMap] = useState(false)
	const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)

	const { location: ipLocation, zip: ipZip, isLoading: isGeolocationLoading } = useGeolocation()

	// Fülle PLZ automatisch aus IP, wenn verfügbar
	useEffect(() => {
		if (ipZip && !zipCode) {
			setZipCode(ipZip)
		}
	}, [ipZip, zipCode])

	// Geocode PLZ zu Koordinaten
	const geocodeZip = useCallback(async (zip: string) => {
		if (!zip || zip.trim().length === 0) {
			setZipLocation(null)
			return
		}

		// Validiere PLZ (5-stellige deutsche PLZ)
		const zipPattern = /^\d{5}$/
		if (!zipPattern.test(zip.trim())) {
			setZipLocation(null)
			return
		}

		setIsGeocodingZip(true)
		try {
			const response = await fetch(`/api/geocode?zip=${encodeURIComponent(zip.trim())}`)
			const data = await response.json()

			if (data.success && data.lat && data.lng) {
				setZipLocation({
					lat: data.lat,
					lng: data.lng,
				})
			} else {
				setZipLocation(null)
			}
		} catch (error) {
			console.error('Geocoding fehlgeschlagen:', error)
			setZipLocation(null)
		} finally {
			setIsGeocodingZip(false)
		}
	}, [])

	// Geocode PLZ, wenn sie sich ändert
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (zipCode.trim().length > 0) {
				void geocodeZip(zipCode)
			} else {
				setZipLocation(null)
			}
		}, 500) // Debounce: 500ms

		return () => clearTimeout(timeoutId)
	}, [zipCode, geocodeZip])

	// Verwende zipLocation für Filter, falls verfügbar, sonst ipLocation
	const userLocation = zipLocation || ipLocation || null
	const isLocationAvailable = !!userLocation

	// Stabilisiere Arrays für stabile Dependencies
	const sod1FiltersKey = useMemo(() => JSON.stringify([...sod1Filters].sort()), [sod1Filters])
	const hdFiltersKey = useMemo(() => JSON.stringify([...hdFilters].sort()), [hdFilters])
	const examinationFiltersKey = useMemo(() => JSON.stringify([...examinationFilters].sort()), [examinationFilters])

	// Mappe ExaminationFilter auf die entsprechenden Filter
	const onlyHD = examinationFilters.includes('HD')
	const onlyHeartCheck = examinationFilters.includes('HeartCheck')
	const onlyGenprofil = examinationFilters.includes('Genprofil')
	const onlyEyesCheck = examinationFilters.includes('EyesCheck')
	const onlyColorCheck = examinationFilters.includes('ColorCheck')

	const filters = useMemo(() => ({
		nameFilter,
		sexFilter,
		colorFilter,
		chipNoFilter,
		sod1Filters: sod1Filters.length > 0 ? sod1Filters : undefined,
		hdFilters: hdFilters.length > 0 ? hdFilters : undefined,
		onlyHD: onlyHD || undefined,
		onlyHeartCheck: onlyHeartCheck || undefined,
		onlyGenprofil: onlyGenprofil || undefined,
		onlyEyesCheck: onlyEyesCheck || undefined,
		onlyColorCheck: onlyColorCheck || undefined,
		maxDistance: maxDistance === '' ? undefined : maxDistance,
		userLocation: userLocation || undefined,
	}), [nameFilter, sexFilter, colorFilter, chipNoFilter, sod1FiltersKey, hdFiltersKey, examinationFiltersKey, maxDistance, userLocation])

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

	// Automatische Suche auslösen, wenn sich die Seite ändert und bereits gesucht wurde
	useEffect(() => {
		if (hasSearched && page > 0) {
			void searchDogs()
		}
	}, [page, hasSearched, searchDogs])

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
										color: '#facc15',
									},
									'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
										backgroundColor: '#facc15',
									},
								}}
							/>
						}
						label='Karte anzeigen'
					/>
				</Box>

				{/* Karte */}
				<DogMap isVisible={showMap} dogs={enrichedDogs} userLocation={zipLocation} />
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
							<MenuItem value='SM'>Schwarz-Marken</MenuItem>
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

				{/* Zweite Zeile: SOD1, HD, Untersuchungen (rechts neben HD, unter Chipnummer) */}
				<Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, alignItems: 'start' }}>
					<FormControl fullWidth size='small'>
						<InputLabel>SOD1</InputLabel>
						<Select
							multiple
							value={sod1Filters}
							label='SOD1'
							onChange={(e) => {
								const value = e.target.value
								setSod1Filters(typeof value === 'string' ? value.split(',') as Sod1Filter[] : value as Sod1Filter[])
							}}
							input={<OutlinedInput label='SOD1' />}
							renderValue={(selected) => (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
									{selected.map((value) => (
										<Chip key={value} label={formatSod1ForDisplay(value)} size='small' />
									))}
								</Box>
							)}
						>
							<MenuItem value='N_N'>N/N</MenuItem>
							<MenuItem value='N_DM'>N/DM</MenuItem>
							<MenuItem value='DM_DM'>DM/DM</MenuItem>
						</Select>
					</FormControl>

					<FormControl fullWidth size='small'>
						<InputLabel>HD</InputLabel>
						<Select
							multiple
							value={hdFilters}
							label='HD'
							onChange={(e) => {
								const value = e.target.value
								setHdFilters(typeof value === 'string' ? value.split(',') as HDFilter[] : value as HDFilter[])
							}}
							input={<OutlinedInput label='HD' />}
							renderValue={(selected) => (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
									{selected.map((value) => (
										<Chip key={value} label={value} size='small' />
									))}
								</Box>
							)}
						>
							<MenuItem value='A1'>A1</MenuItem>
							<MenuItem value='A2'>A2</MenuItem>
							<MenuItem value='B1'>B1</MenuItem>
							<MenuItem value='B2'>B2</MenuItem>
						</Select>
					</FormControl>

					<FormControl fullWidth size='small'>
						<InputLabel>Untersuchungen</InputLabel>
						<Select
							multiple
							value={examinationFilters}
							label='Untersuchungen'
							onChange={(e) => {
								const value = e.target.value
								setExaminationFilters(typeof value === 'string' ? value.split(',') as ExaminationFilter[] : value as ExaminationFilter[])
							}}
							input={<OutlinedInput label='Untersuchungen' />}
							renderValue={(selected) => (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
									{selected.map((value) => {
										const labels: Record<ExaminationFilter, string> = {
											HD: 'Nur HD',
											HeartCheck: 'Nur mit Herzuntersuchung',
											Genprofil: 'Nur mit Genprofil',
											EyesCheck: 'Nur mit Augenuntersuchung',
											ColorCheck: 'Nur mit Farbverdünnung',
										}
										return (
											<Chip key={value} label={labels[value]} size='small' />
										)
									})}
								</Box>
							)}
						>
							<MenuItem value='HD'>Nur HD</MenuItem>
							<MenuItem value='HeartCheck'>Nur mit Herzuntersuchung</MenuItem>
							<MenuItem value='Genprofil'>Nur mit Genprofil</MenuItem>
							<MenuItem value='EyesCheck'>Nur mit Augenuntersuchung</MenuItem>
							<MenuItem value='ColorCheck'>Nur mit Farbverdünnung</MenuItem>
						</Select>
					</FormControl>
				</Box>

				{/* PLZ und Maximale Entfernung */}
				<Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
					<TextField
						label='PLZ'
						value={zipCode}
						onChange={(e) => {
							const value = e.target.value.replace(/\D/g, '').slice(0, 5) // Nur Zahlen, max. 5 Zeichen
							setZipCode(value)
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleSearch()
							}
						}}
						placeholder='Postleitzahl'
						fullWidth
						size='small'
						helperText={isGeocodingZip ? 'Suche Koordinaten...' : zipLocation ? 'Koordinaten gefunden' : zipCode && zipCode.length === 5 ? 'Koordinaten werden gesucht...' : ''}
					/>
					<FormControl fullWidth size='small' disabled={!isLocationAvailable || isGeocodingZip}>
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

				<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
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
										backgroundColor: '#facc15',
										color: '#565757',
										'&:hover': {
											backgroundColor: '#e6b800',
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
						{enrichedDogs.map((dog) => (
							<DogCard
								key={dog.documentId}
								dog={dog}
								strapiBaseUrl={strapiBaseUrl}
								onImageClick={() => handleDogImageClick(dog)}
								userLocation={userLocation}
								maxDistance={maxDistance === '' ? undefined : maxDistance}
							/>
						))}
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
										backgroundColor: '#facc15',
										color: '#565757',
										'&:hover': {
											backgroundColor: '#e6b800',
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
			/>
		</div>
	)
}


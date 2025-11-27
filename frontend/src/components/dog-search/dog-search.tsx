'use client'

import { useCallback, useMemo, useState } from 'react'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box, Switch, FormControlLabel, Chip, OutlinedInput } from '@mui/material'
import { useDogs, type ColorFilter, type PageSize, type SexFilter, type Sod1Filter, type HDFilter } from '@/hooks/use-dogs'

type ExaminationFilter = 'HD' | 'HeartCheck' | 'Genprofil' | 'EyesCheck' | 'ColorCheck'
import { DogCard } from './dog-card'
import { DogMap } from './dog-map'
import { DogDetailModal } from './dog-detail-modal'
import type { Dog } from '@/types'

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
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [showMap, setShowMap] = useState(false)
	const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)

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
	}), [nameFilter, sexFilter, colorFilter, chipNoFilter, sod1FiltersKey, hdFiltersKey, examinationFiltersKey])

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
		autoLoad: true,
	})

	const handleSearch = useCallback(() => {
		setPage(1)
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
				<DogMap isVisible={showMap} />
			<Box className='rounded-lg bg-white p-4 shadow-md'>
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
										<Chip key={value} label={value} size='small' />
									))}
								</Box>
							)}
						>
							<MenuItem value='N/N'>N/N</MenuItem>
							<MenuItem value='N/DM'>N/DM</MenuItem>
							<MenuItem value='DM/DM'>DM/DM</MenuItem>
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
				</Box>

				{/* Untersuchungen Filter */}
				<Box sx={{ mt: 2 }}>
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
			) : dogs.length > 0 ? (
				<>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{dogs.map((dog) => (
							<DogCard
								key={dog.documentId}
								dog={dog}
								strapiBaseUrl={strapiBaseUrl}
								onImageClick={() => handleDogImageClick(dog)}
							/>
						))}
					</div>

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


'use client'

import { useCallback, useState } from 'react'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box, Switch, FormControlLabel } from '@mui/material'
import { useDogs, type ColorFilter, type PageSize, type SexFilter, type BooleanFilter } from '@/hooks/use-dogs'
import { DogCard } from './dog-card'
import { DogMap } from './dog-map'
import { DogDetailModal } from './dog-detail-modal'
import type { Dog } from '@/types'

interface DogSearchProps {
	strapiBaseUrl?: string | null
}

export function DogSearch({ strapiBaseUrl }: DogSearchProps) {
	const [nameFilter, setNameFilter] = useState('')
	const [sexFilter, setSexFilter] = useState<SexFilter>('')
	const [colorFilter, setColorFilter] = useState<ColorFilter>('')
	const [chipNoFilter, setChipNoFilter] = useState('')
	const [sod1testFilter, setSod1testFilter] = useState<BooleanFilter>('')
	const [hdtestFilter, setHdtestFilter] = useState<BooleanFilter>('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [showMap, setShowMap] = useState(false)
	const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)

	const {
		dogs,
		totalDogs,
		pageCount,
		isLoading,
		error,
		searchDogs,
	} = useDogs({
		filters: {
			nameFilter,
			sexFilter,
			colorFilter,
			chipNoFilter,
			sod1testFilter,
			hdtestFilter,
		},
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
						<InputLabel>Geschlecht</InputLabel>
						<Select
							value={sexFilter}
							label='Geschlecht'
							onChange={(e) => setSexFilter(e.target.value as SexFilter)}
						>
							<MenuItem value=''>Alle</MenuItem>
							<MenuItem value='M'>Rüde</MenuItem>
							<MenuItem value='F'>Hündin</MenuItem>
						</Select>
					</FormControl>

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
							<MenuItem value='B'>Braun</MenuItem>
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
						<InputLabel>SOD1-Test</InputLabel>
						<Select
							value={sod1testFilter === true ? 'true' : sod1testFilter === false ? 'false' : ''}
							label='SOD1-Test'
							onChange={(e) => {
								const value = e.target.value
								if (value === 'true') {
									setSod1testFilter(true)
								} else if (value === 'false') {
									setSod1testFilter(false)
								} else {
									setSod1testFilter('')
								}
							}}
						>
							<MenuItem value=''>Egal</MenuItem>
							<MenuItem value='true'>Ja</MenuItem>
							<MenuItem value='false'>Nein</MenuItem>
						</Select>
					</FormControl>

					<FormControl fullWidth size='small'>
						<InputLabel>HD-Test</InputLabel>
						<Select
							value={hdtestFilter === true ? 'true' : hdtestFilter === false ? 'false' : ''}
							label='HD-Test'
							onChange={(e) => {
								const value = e.target.value
								if (value === 'true') {
									setHdtestFilter(true)
								} else if (value === 'false') {
									setHdtestFilter(false)
								} else {
									setHdtestFilter('')
								}
							}}
						>
							<MenuItem value=''>Egal</MenuItem>
							<MenuItem value='true'>Ja</MenuItem>
							<MenuItem value='false'>Nein</MenuItem>
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


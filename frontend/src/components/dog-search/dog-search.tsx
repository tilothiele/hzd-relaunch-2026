'use client'

import { useCallback, useState } from 'react'
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
				<div className='flex items-center justify-between rounded-lg bg-white p-4 shadow-md'>
					<label className='flex items-center gap-3 text-sm font-medium text-gray-700'>
						<span>Karte anzeigen</span>
						<button
							type='button'
							role='switch'
							aria-checked={showMap}
							onClick={() => setShowMap(!showMap)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 ${
								showMap ? 'bg-yellow-400' : 'bg-gray-300'
							}`}
						>
							<span
								className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
									showMap ? 'translate-x-6' : 'translate-x-1'
								}`}
							/>
						</button>
					</label>
				</div>

				{/* Karte */}
				<DogMap isVisible={showMap} />
			<div className='rounded-lg bg-white shadow-md grid gap-3'>
				<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
					<div>
						<label
							htmlFor='name-filter'
							className='mb-2 block text-sm font-medium text-gray-700'
						>
							Name
						</label>
						<input
							id='name-filter'
							type='text'
							value={nameFilter}
							onChange={(e) => setNameFilter(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleSearch()
								}
							}}
							placeholder='Name oder Zuchtname'
							className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
						/>
					</div>
					<div className='space-y-2'>
						<label
							htmlFor='sex-filter'
							className='mb-2 block text-sm font-medium text-gray-700'
						>
							Geschlecht
						</label>
						<select
							id='sex-filter'
							value={sexFilter}
							onChange={(e) => setSexFilter(e.target.value as SexFilter)}
							className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
						>
							<option value=''>Alle</option>
							<option value='M'>Rüde</option>
							<option value='F'>Hündin</option>
						</select>
					</div>
					<div className='my-2'>
						<label
							htmlFor='color-filter'
							className='mb-2 block text-sm font-medium text-gray-700'
						>
							Farbe
						</label>
						<select
							id='color-filter'
							value={colorFilter}
							onChange={(e) => setColorFilter(e.target.value as ColorFilter)}
							className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
						>
							<option value=''>Alle</option>
							<option value='S'>Schwarz</option>
							<option value='SM'>Schwarz-Marken</option>
							<option value='B'>Braun</option>
						</select>
					</div>
					<div>
						<label
							htmlFor='chipno-filter'
							className='mb-2 block text-sm font-medium text-gray-700'
						>
							Chipnummer
						</label>
						<input
							id='chipno-filter'
							type='text'
							value={chipNoFilter}
							onChange={(e) => setChipNoFilter(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleSearch()
								}
							}}
							placeholder='Chipnummer'
							className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
						/>
					</div>
					<div>
						<label
							htmlFor='sod1test-filter'
							className='mb-2 block text-sm font-medium text-gray-700'
						>
							SOD1-Test
						</label>
						<select
							id='sod1test-filter'
							value={sod1testFilter === true ? 'true' : sod1testFilter === false ? 'false' : ''}
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
							className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
						>
							<option value=''>Egal</option>
							<option value='true'>Ja</option>
							<option value='false'>Nein</option>
						</select>
					</div>
					<div>
						<label
							htmlFor='hdtest-filter'
							className='mb-2 block text-sm font-medium text-gray-700'
						>
							HD-Test
						</label>
						<select
							id='hdtest-filter'
							value={hdtestFilter === true ? 'true' : hdtestFilter === false ? 'false' : ''}
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
							className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
						>
							<option value=''>Egal</option>
							<option value='true'>Ja</option>
							<option value='false'>Nein</option>
						</select>
					</div>
				</div>
				<div className='mt-6 flex justify-end'>
					<button
						type='button'
						onClick={handleSearch}
						disabled={isLoading}
						className='rounded bg-yellow-400 px-6 py-2 text-sm font-semibold text-gray-900 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isLoading ? 'Suche...' : 'Suchen'}
					</button>
				</div>
			</div>

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


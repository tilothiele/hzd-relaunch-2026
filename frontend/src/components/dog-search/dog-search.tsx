'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_DOGS } from '@/lib/graphql/queries'
import type { Dog, DogSearchResult } from '@/types'
import Image from 'next/image'

interface DogSearchProps {
	strapiBaseUrl: string
}

type SexFilter = 'M' | 'F' | ''
type ColorFilter = 'S' | 'SM' | 'B' | ''
type PageSize = 5 | 10 | 20

export function DogSearch({ strapiBaseUrl }: DogSearchProps) {
	const [nameFilter, setNameFilter] = useState('')
	const [sexFilter, setSexFilter] = useState<SexFilter>('')
	const [colorFilter, setColorFilter] = useState<ColorFilter>('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [dogs, setDogs] = useState<Dog[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalDogs, setTotalDogs] = useState(0)
	const [pageCount, setPageCount] = useState(0)

	const searchDogs = useCallback(async () => {
		if (!strapiBaseUrl) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const filterConditions: Array<Record<string, unknown>> = []

			if (nameFilter.trim()) {
				filterConditions.push({
					or: [
						{ givenName: { containsi: nameFilter.trim() } },
						{ fullKennelName: { containsi: nameFilter.trim() } },
					],
				})
			}

			if (sexFilter) {
				filterConditions.push({
					sex: { eq: sexFilter },
				})
			}

			if (colorFilter) {
				filterConditions.push({
					color: { eq: colorFilter },
				})
			}

			const variables: Record<string, unknown> = {
				pagination: {
					page,
					pageSize,
				},
				sort: ['fullKennelName:asc'],
			}

			if (filterConditions.length > 0) {
				variables.filters = {
					and: filterConditions,
				}
			}

			const data = await fetchGraphQL<DogSearchResult>(
				SEARCH_DOGS,
				{
					baseUrl: strapiBaseUrl,
					variables,
				},
			)

			const dogsArray = Array.isArray(data.hzdPluginDogs) ? data.hzdPluginDogs : []
			setDogs(dogsArray)

			// Berechne Paginierung basierend auf den übergebenen Parametern
			// Da die Meta-Informationen nicht in der Antwort enthalten sind,
			// schätzen wir die Gesamtzahl basierend auf der Anzahl der zurückgegebenen Ergebnisse
			// Wenn wir genau pageSize Ergebnisse haben, gibt es wahrscheinlich mehr
			const estimatedTotal = dogsArray.length === pageSize && page > 1
				? page * pageSize + 1
				: dogsArray.length === pageSize
					? page * pageSize
					: (page - 1) * pageSize + dogsArray.length

			const calculatedPageCount = Math.ceil(estimatedTotal / pageSize)

			setTotalDogs(estimatedTotal)
			setPageCount(calculatedPageCount)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Hunde konnten nicht geladen werden.')
			setError(fetchError)
			setDogs([])
			setTotalDogs(0)
			setPageCount(0)
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, nameFilter, sexFilter, colorFilter, page, pageSize])

	useEffect(() => {
		void searchDogs()
	}, [searchDogs])

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

	const totalPages = pageCount
	const currentPage = page

	const getColorLabel = useCallback((color: string | null | undefined) => {
		switch (color) {
		case 'S':
			return 'Schwarz'
		case 'SM':
			return 'Schwarz-Marken'
		case 'B':
			return 'Braun'
		default:
			return '-'
		}
	}, [])

	const getSexLabel = useCallback((sex: string | null | undefined) => {
		switch (sex) {
		case 'M':
			return 'Rüde'
		case 'F':
			return 'Hündin'
		default:
			return '-'
		}
	}, [])

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

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='mb-8 rounded-lg bg-white p-6 shadow-md'>
				<h2 className='mb-6 text-2xl font-bold text-gray-900'>
					Hunde suchen
				</h2>
				<div className='grid gap-4 md:grid-cols-3'>
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
					<div>
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
					<div>
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
				</div>
				<div className='mt-4 flex justify-end'>
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
				<div className='mb-4 rounded bg-red-50 p-4 text-sm text-red-800'>
					{error.message}
				</div>
			) : null}

			<div className='mb-4 flex items-center justify-between'>
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
				<div className='text-center py-8 text-gray-600'>
					Lade Hunde...
				</div>
			) : dogs.length > 0 ? (
				<>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{dogs.map((dog) => {
							const avatarUrl = dog.avatar?.url
							const avatarAlt = dog.avatar?.alternativeText ?? 'Hund'
							const fullName = dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'

							return (
								<div
									key={dog.documentId}
									className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md'
								>
									{avatarUrl ? (
										<div className='mb-3 flex justify-center'>
											<Image
												src={`${strapiBaseUrl}${avatarUrl}`}
												alt={avatarAlt}
												width={200}
												height={200}
												className='h-48 w-48 rounded object-cover'
												unoptimized
											/>
										</div>
									) : (
										<div className='mb-3 flex h-48 items-center justify-center rounded bg-gray-100 text-gray-400'>
											Kein Bild
										</div>
									)}
									<h3 className='mb-2 text-lg font-semibold text-gray-900'>
										{fullName}
									</h3>
									{dog.givenName && dog.fullKennelName ? (
										<p className='mb-2 text-sm text-gray-600'>
											Rufname: {dog.givenName}
										</p>
									) : null}
									<div className='space-y-1 text-sm text-gray-600'>
										<p>
											<strong>Geschlecht:</strong> {getSexLabel(dog.sex)}
										</p>
										<p>
											<strong>Farbe:</strong> {getColorLabel(dog.color)}
										</p>
										{dog.dateOfBirth ? (
											<p>
												<strong>Geburtsdatum:</strong> {formatDate(dog.dateOfBirth)}
											</p>
										) : null}
										{dog.microchipNo ? (
											<p>
												<strong>Chip-Nr.:</strong> {dog.microchipNo}
											</p>
										) : null}
									</div>
								</div>
							)
						})}
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
	)
}


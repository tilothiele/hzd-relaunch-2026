'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_BREEDERS } from '@/lib/graphql/queries'
import type { Breeder, BreederSearchResult } from '@/types'

interface BreederSearchProps {
	strapiBaseUrl?: string | null
}

type PageSize = 5 | 10 | 20

export function BreederSearch({ strapiBaseUrl }: BreederSearchProps) {
	const [nameFilter, setNameFilter] = useState('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [breeders, setBreeders] = useState<Breeder[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalBreeders, setTotalBreeders] = useState(0)
	const [pageCount, setPageCount] = useState(0)

	const searchBreeders = useCallback(async () => {
		if (!strapiBaseUrl) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const filterConditions: Array<Record<string, unknown>> = []

			if (nameFilter.trim()) {
				filterConditions.push({
					kennelName: { containsi: nameFilter.trim() },
				})
			}

			const variables: Record<string, unknown> = {
				pagination: {
					page,
					pageSize,
				},
				sort: ['kennelName:asc'],
			}

			if (filterConditions.length > 0) {
				variables.filters = {
					and: filterConditions,
				}
			}

			const data = await fetchGraphQL<BreederSearchResult>(
				SEARCH_BREEDERS,
				{
					baseUrl: strapiBaseUrl,
					variables,
				},
			)

			const breedersArray = Array.isArray(data.hzdPluginBreeders) ? data.hzdPluginBreeders : []
			setBreeders(breedersArray)

			// Berechne Paginierung basierend auf den übergebenen Parametern
			// Da die Meta-Informationen nicht in der Antwort enthalten sind,
			// schätzen wir die Gesamtzahl basierend auf der Anzahl der zurückgegebenen Ergebnisse
			// Wenn wir genau pageSize Ergebnisse haben, gibt es wahrscheinlich mehr
			const estimatedTotal = breedersArray.length === pageSize && page > 1
				? page * pageSize + 1
				: breedersArray.length === pageSize
					? page * pageSize
					: (page - 1) * pageSize + breedersArray.length

			const calculatedPageCount = Math.ceil(estimatedTotal / pageSize)

			setTotalBreeders(estimatedTotal)
			setPageCount(calculatedPageCount)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Züchter konnten nicht geladen werden.')
			setError(fetchError)
			setBreeders([])
			setTotalBreeders(0)
			setPageCount(0)
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, nameFilter, page, pageSize])

	useEffect(() => {
		void searchBreeders()
	}, [searchBreeders])

	const handleSearch = useCallback(() => {
		setPage(1)
		void searchBreeders()
	}, [searchBreeders])

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

	const getRegionLabel = useCallback((region: string | null | undefined) => {
		if (!region) {
			return '-'
		}

		return region
	}, [])

	return (
		<div className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div className='w-full max-w-6xl'>
			<div className='mb-8 rounded-lg bg-white p-6 shadow-md'>
				<h2 className='mb-6 text-2xl font-bold text-gray-900'>
					Züchter suchen
				</h2>
				<div className='grid gap-4 md:grid-cols-1'>
					<div>
						<label
							htmlFor='name-filter'
							className='mb-2 block text-sm font-medium text-gray-700'
						>
							Zwingername
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
							placeholder='Zwingername'
							className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
						/>
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
					{totalBreeders > 0 ? (
						<>
							Zeige {((currentPage - 1) * pageSize) + 1} bis{' '}
							{Math.min(currentPage * pageSize, totalBreeders)} von {totalBreeders} Züchtern
						</>
					) : (
						'Keine Züchter gefunden'
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
					Lade Züchter...
				</div>
			) : breeders.length > 0 ? (
				<>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{breeders.map((breeder) => {
							const kennelName = breeder.kennelName ?? 'Unbekannt'
							const member = breeder.member

							return (
								<div
									key={breeder.documentId}
									className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md'
								>
									<h3 className='mb-3 text-lg font-semibold text-gray-900'>
										{kennelName}
									</h3>
									<div className='space-y-2 text-sm text-gray-600'>
										{breeder.breedingLicenseSince ? (
											<p>
												<strong>Zuchterlaubnis seit:</strong> {formatDate(breeder.breedingLicenseSince)}
											</p>
										) : null}
										{member?.fullName ? (
											<p>
												<strong>Züchter:</strong> {member.fullName}
											</p>
										) : null}
										{member?.region ? (
											<p>
												<strong>Region:</strong> {getRegionLabel(member.region)}
											</p>
										) : null}
										{member?.phone ? (
											<p>
												<strong>Telefon:</strong> {member.phone}
											</p>
										) : null}
										{member?.adress1 || member?.adress2 ? (
											<p>
												<strong>Adresse:</strong>{' '}
												{[member.adress1, member.adress2].filter(Boolean).join(', ')}
											</p>
										) : null}
										{member?.zip || member?.countryCode ? (
											<p>
												<strong>PLZ / Land:</strong>{' '}
												{[member.zip, member.countryCode].filter(Boolean).join(' / ')}
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
					Keine Züchter gefunden. Bitte passen Sie Ihre Suchkriterien an.
				</div>
			) : null}
			</div>
		</div>
	)
}


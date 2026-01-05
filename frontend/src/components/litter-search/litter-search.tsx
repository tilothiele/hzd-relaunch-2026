'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box } from '@mui/material'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_LITTERS } from '@/lib/graphql/queries'
import type { Litter, LitterSearchResult } from '@/types'

interface LitterSearchProps {
	strapiBaseUrl: string
}

type PageSize = 5 | 10 | 20

export function LitterSearch({ strapiBaseUrl }: LitterSearchProps) {
	const [breederFilter, setBreederFilter] = useState('')
	const [motherFilter, setMotherFilter] = useState('')
	const [closedFilter, setClosedFilter] = useState<'' | 'true' | 'false'>('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [litters, setLitters] = useState<Litter[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalLitters, setTotalLitters] = useState(0)
	const [pageCount, setPageCount] = useState(0)

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
					closed: { eq: closedFilter === 'true' },
				})
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
	}, [strapiBaseUrl, breederFilter, motherFilter, closedFilter, page, pageSize])

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

	return (
		<div className='container mx-auto px-4 py-8'>
			<Box className='mb-8 rounded-lg bg-white p-6 shadow-md'>
				<h2 className='mb-6 text-2xl font-bold text-gray-900'>
					Würfe suchen
				</h2>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
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
				<div className='mb-4 rounded bg-red-50 p-4 text-sm text-red-800'>
					{error.message}
				</div>
			) : null}

			<div className='mb-4 flex items-center justify-between'>
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
											{orderLetter}-Wurf {kennelName}
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


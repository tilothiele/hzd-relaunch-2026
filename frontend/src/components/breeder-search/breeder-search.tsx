'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Pagination, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_BREEDERS } from '@/lib/graphql/queries'
import type { Breeder, BreederSearchResult } from '@/types'
import { BreederCard } from './breeder-card'
import { BreederSearchForm } from './breeder-search-form'
import { theme } from '@/themes'

interface BreederSearchProps {
	strapiBaseUrl?: string | null
}

type PageSize = 5 | 10 | 20 | 50 | 100

export function BreederSearch({ strapiBaseUrl }: BreederSearchProps) {
	const [nameFilter, setNameFilter] = useState('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [breeders, setBreeders] = useState<Breeder[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalBreeders, setTotalBreeders] = useState(0)
	const [pageCount, setPageCount] = useState(0)
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

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

	return (
		<div className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div className='w-full max-w-6xl'>
				<BreederSearchForm
					nameFilter={nameFilter}
					onNameFilterChange={setNameFilter}
					onSearch={handleSearch}
					isLoading={isLoading}
				/>

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
							<option value={50}>50</option>
							<option value={100}>100</option>
						</select>
					</div>
				</div>

				{isLoading ? (
					<div className='text-center py-8 text-gray-600'>
						Lade Züchter...
					</div>
				) : breeders.length > 0 ? (
					<>
						{viewMode === 'cards' ? (
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
								{breeders.map((breeder) => (
									<BreederCard
										key={breeder.documentId}
										breeder={breeder}
									/>
								))}
							</div>
						) : (
							<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
								<Table size="small">
									<TableHead sx={{ backgroundColor: '#f9fafb' }}>
										<TableRow>
											<TableCell sx={{ fontWeight: 'bold' }}>Zwinger</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>Ort</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>PLZ</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>Telefon</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>E-Mail</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{breeders.map((breeder) => {
											const memberName = ((breeder.member?.firstName || '') + ' ' + (breeder.member?.lastName || '')).trim()

											return (
												<TableRow key={breeder.documentId} hover>
													<TableCell>{breeder.kennelName || '-'}</TableCell>
													<TableCell>{memberName || '-'}</TableCell>
													<TableCell>{breeder.member?.city || '-'}</TableCell>
													<TableCell>{breeder.member?.zip || '-'}</TableCell>
													<TableCell>{breeder.member?.phone || '-'}</TableCell>
													<TableCell>{breeder.member?.email || '-'}</TableCell>
												</TableRow>
											)
										})}
									</TableBody>
								</Table>
							</TableContainer>
						)}

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
						Keine Züchter gefunden. Bitte passen Sie Ihre Suchkriterien an.
					</div>
				) : null}
			</div>
		</div>
	)
}


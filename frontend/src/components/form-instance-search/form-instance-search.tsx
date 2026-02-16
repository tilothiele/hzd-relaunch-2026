'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, Paper, TextField, Button, FormControl, InputLabel, Select, MenuItem, Pagination, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material'
import Link from 'next/link'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_FORMS, COUNT_FORM_INSTANCES } from '@/lib/graphql/queries'
import type { Form, FormSearchResult, FormInstanceSearchResult, AuthUser } from '@/types'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { ActionButton } from '@/components/ui/action-button'
import { useTheme } from '@/hooks/use-theme'

interface FormsInstanceSearchProps {
	strapiBaseUrl: string
	user: AuthUser | null
	isAuthenticated: boolean
}

type PageSize = 5 | 10 | 20

interface FormWithCount extends Form {
	instanceCount: number
	latestInstanceCreatedAt?: string | null
}

export function FormsInstanceSearch({ strapiBaseUrl, user, isAuthenticated }: FormsInstanceSearchProps) {
	const { theme } = useTheme()
	const [formNameFilter, setFormNameFilter] = useState('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [forms, setForms] = useState<Form[]>([])
	const [formsWithCount, setFormsWithCount] = useState<FormWithCount[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isLoadingCounts, setIsLoadingCounts] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalCount, setTotalCount] = useState(0)
	const [pageCount, setPageCount] = useState(0)

	const formatDate = useCallback((dateString: string | null | undefined) => {
		if (!dateString) {
			return 'N/A'
		}

		try {
			return new Date(dateString).toLocaleDateString('de-DE', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			})
		} catch {
			return dateString
		}
	}, [])

	const loadFormInstanceCounts = useCallback(async (formsToCount: Form[]) => {
		if (!strapiBaseUrl || formsToCount.length === 0) {
			return
		}

		setIsLoadingCounts(true)

		try {
			const countPromises = formsToCount.map(async (form) => {
				try {
					const data = await fetchGraphQL<FormInstanceSearchResult>(
						COUNT_FORM_INSTANCES,
						{
							baseUrl: strapiBaseUrl,
							variables: {
								filters: {
									form: {
										documentId: {
											eq: form.documentId,
										},
									},
								},
							},
						},
					)

					const instances = Array.isArray(data.formInstances) ? data.formInstances : []
					const latestInstance = instances.reduce((latest, current) => {
						if (!latest) return current
						if (!current.createdAt) return latest
						if (!latest.createdAt) return current
						return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
					}, null as (typeof instances)[0] | null)

					return {
						...form,
						instanceCount: instances.length,
						latestInstanceCreatedAt: latestInstance?.createdAt || null,
					}
				} catch (err) {
					console.error(`Fehler beim Zählen der Instanzen für Form ${form.documentId}:`, err)
					return {
						...form,
						instanceCount: 0,
					}
				}
			})

			const formsWithCounts = await Promise.all(countPromises)
			setFormsWithCount(formsWithCounts)
		} catch (err) {
			console.error('Fehler beim Laden der Instanz-Anzahlen:', err)
		} finally {
			setIsLoadingCounts(false)
		}
	}, [strapiBaseUrl])

	const searchForms = useCallback(async () => {
		if (!strapiBaseUrl || !isAuthenticated || !user?.documentId) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const filterConditions: Array<Record<string, unknown>> = []

			// Filter nach Formular-Name
			if (formNameFilter.trim()) {
				filterConditions.push({
					Name: { containsi: formNameFilter.trim() },
				})
			}

			// Filter nach EventAdmin (nur Formulare des aktuellen Users anzeigen)
			filterConditions.push({
				EventAdmin: {
					documentId: {
						eq: user.documentId
					}
				}
			})

			const variables: Record<string, unknown> = {
				pagination: {
					page,
					pageSize,
				},
				sort: ['Name:asc'],
			}

			if (filterConditions.length > 0) {
				variables.filters = {
					and: filterConditions,
				}
			}

			const data = await fetchGraphQL<FormSearchResult>(
				SEARCH_FORMS,
				{
					baseUrl: strapiBaseUrl,
					variables,
				},
			)

			const formsArray = Array.isArray(data.forms) ? data.forms : []
			setForms(formsArray)

			// Schätze die Gesamtzahl basierend auf der Anzahl der zurückgegebenen Ergebnisse
			const estimatedTotal = formsArray.length === pageSize && page > 1
				? page * pageSize + 1
				: formsArray.length === pageSize
					? page * pageSize
					: (page - 1) * pageSize + formsArray.length

			const calculatedPageCount = Math.ceil(estimatedTotal / pageSize)

			setTotalCount(estimatedTotal)
			setPageCount(calculatedPageCount)

			// Lade Instanz-Anzahlen für die gefundenen Forms
			await loadFormInstanceCounts(formsArray)
		} catch (err) {
			console.error('Fehler beim Laden der Formulare:', err)
			setError(err instanceof Error ? err : new Error('Unbekannter Fehler'))
			setForms([])
			setFormsWithCount([])
			setTotalCount(0)
			setPageCount(0)
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, formNameFilter, page, pageSize, loadFormInstanceCounts, isAuthenticated, user])

	useEffect(() => {
		void searchForms()
	}, [searchForms])

	const handleSearch = useCallback(() => {
		setPage(1)
		void searchForms()
	}, [searchForms])

	const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, value: number) => {
		setPage(value)
	}, [])

	const handlePageSizeChange = useCallback((event: { target: { value: unknown } }) => {
		setPageSize(event.target.value as PageSize)
		setPage(1)
	}, [])

	if (!isAuthenticated) {
		return null
	}

	return (
		<SectionContainer>
			<Box className='container mx-auto px-4 py-8'>
				<Box className='mb-8 rounded-lg bg-white p-6 shadow-md'>
					<Typography variant='h5' className='mb-6 font-bold text-gray-900'>
						Formulare suchen
					</Typography>
					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 2 }}>
						<TextField
							label='Formular-Name'
							value={formNameFilter}
							onChange={(e) => setFormNameFilter(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									handleSearch()
								}
							}}
							placeholder='Name des Formulars'
							fullWidth
							size='small'
						/>
					</Box>
					<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
						<ActionButton
							actionButton={{
								Label: isLoading ? 'Suche...' : 'Suchen',
								Primary: true,
							}}
							onClick={handleSearch}
							disabled={isLoading}
							theme={theme}
							style={{
								padding: '5px 20px',
								fontSize: '0.92rem',
							}}
						/>
					</Box>
				</Box>

				{error ? (
					<Box className='mb-4 rounded bg-red-50 p-4 text-sm text-red-800'>
						{error.message}
					</Box>
				) : null}

				<Box className='mb-4 flex items-center justify-between'>
					<Typography variant='body2' className='text-gray-600'>
						{totalCount > 0 ? `${totalCount} Ergebnis${totalCount !== 1 ? 'se' : ''} gefunden` : 'Keine Ergebnisse'}
					</Typography>
					<FormControl size='small' sx={{ minWidth: 120 }}>
						<InputLabel>Pro Seite</InputLabel>
						<Select
							value={pageSize}
							label='Pro Seite'
							onChange={handlePageSizeChange}
						>
							<MenuItem value={5}>5</MenuItem>
							<MenuItem value={10}>10</MenuItem>
							<MenuItem value={20}>20</MenuItem>
						</Select>
					</FormControl>
				</Box>

				{isLoading ? (
					<Box className='flex justify-center py-8'>
						<CircularProgress />
					</Box>
				) : forms.length === 0 ? (
					<Paper className='p-6 text-center text-gray-500'>
						<Typography>Keine Formulare gefunden.</Typography>
					</Paper>
				) : (
					<TableContainer component={Paper} sx={{ boxShadow: 2 }}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 600 }}>Formular-Name</TableCell>
									<TableCell sx={{ fontWeight: 600 }} align='right'>Anzahl Instanzen</TableCell>
									<TableCell sx={{ fontWeight: 600 }}>Erstellt</TableCell>
									<TableCell sx={{ fontWeight: 600 }}>Aktualisiert</TableCell>
									<TableCell sx={{ fontWeight: 600 }} align='center'>Aktionen</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{(isLoadingCounts ? forms : formsWithCount).map((form) => {
									const formWithCount = form as FormWithCount
									return (
										<TableRow key={form.documentId} hover>
											<TableCell>
												<Typography variant='body2' className='font-medium'>
													{form.Name || 'Unbenanntes Formular'}
												</Typography>
											</TableCell>
											<TableCell align='right'>
												{isLoadingCounts ? (
													<CircularProgress size={16} />
												) : (
													<Typography variant='body2'>
														{formWithCount.instanceCount ?? 0}
													</Typography>
												)}
											</TableCell>
											<TableCell>
												<Typography variant='body2' className='text-gray-600'>
													{formatDate(form.createdAt)}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography variant='body2' className='text-gray-600'>
													{formatDate(formWithCount.latestInstanceCreatedAt || form.updatedAt)}
												</Typography>
											</TableCell>
											<TableCell align='center'>
												<Link href={`/form-instance/${form.documentId}`} passHref>
													<IconButton
														size='small'
														aria-label='Details anzeigen'
														sx={{
															color: '#facc15',
															'&:hover': {
																backgroundColor: 'rgba(250, 204, 21, 0.1)',
															},
														}}
													>
														<VisibilityIcon fontSize='small' />
													</IconButton>
												</Link>
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}

				{pageCount > 1 ? (
					<Box className='mt-6 flex justify-center'>
						<Pagination
							count={pageCount}
							page={page}
							onChange={handlePageChange}
							color='primary'
							sx={{
								'& .MuiPaginationItem-root': {
									color: '#565757',
								},
								'& .Mui-selected': {
									backgroundColor: '#facc15',
									color: '#565757',
									'&:hover': {
										backgroundColor: '#e6b800',
									},
								},
							}}
						/>
					</Box>
				) : null}
			</Box>
		</SectionContainer>
	)
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Button } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import PrintIcon from '@mui/icons-material/Print'
import { fetchGraphQL } from '@/lib/graphql-client'
import { COUNT_FORM_INSTANCES } from '@/lib/graphql/queries'
import type { Form, FormInstance, FormInstanceSearchResult } from '@/types'
import type { ThemeDefinition } from '@/themes'

interface FormInstanceListProps {
	form: Form
	strapiBaseUrl: string
	theme?: ThemeDefinition
}

export function FormInstanceList({ form, strapiBaseUrl, theme }: FormInstanceListProps) {
	const [formInstances, setFormInstances] = useState<FormInstance[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	// Extrahiere alle Feldnamen aus den FormFields
	const fieldNames = useMemo(() => {
		if (!form.FormFields) {
			return []
		}

		const names: string[] = []
		for (const field of form.FormFields) {
			if (field.__typename === 'ComponentFormShortTextInput' && field.STName) {
				names.push(field.STName)
			} else if (field.__typename === 'ComponentFormEmailAdress' && field.EAName) {
				names.push(field.EAName)
			} else if (field.__typename === 'ComponentFormTextArea' && field.TAName) {
				names.push(field.TAName)
			} else if (field.__typename === 'ComponentFormNumberInput' && field.NIName) {
				names.push(field.NIName)
			} else if (field.__typename === 'ComponentFormChoice' && field.CName) {
				names.push(field.CName)
			} else if (field.__typename === 'ComponentFormBooleanChoice' && field.BCName) {
				names.push(field.BCName)
			} else if (field.__typename === 'ComponentFormStandardIdentifiers') {
				// StandardIdentifiers haben mehrere Felder
				if (field.FirstName && field.FirstName !== 'Nein') {
					names.push('firstName')
				}
				if (field.LastName && field.LastName !== 'Nein') {
					names.push('lastName')
				}
				if (field.EMail && field.EMail !== 'Nein') {
					names.push('email')
				}
				if (field.Street && field.Street !== 'Nein') {
					names.push('street')
				}
				if (field.Zip && field.Zip !== 'Nein') {
					names.push('zip')
				}
				if (field.City && field.City !== 'Nein') {
					names.push('city')
				}
				if (field.CountryCode && field.CountryCode !== 'Nein') {
					names.push('countryCode')
				}
				if (field.Phone && field.Phone !== 'Nein') {
					names.push('phone')
				}
				if (field.MembershipNumber && field.MembershipNumber !== 'Nein') {
					names.push('membershipNumber')
				}
			}
		}
		return names
	}, [form.FormFields])

	const loadFormInstances = useCallback(async () => {
		if (!strapiBaseUrl || !form.documentId) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			// Hole alle FormInstances für dieses Form (ohne Pagination, um alle zu bekommen)
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
			setFormInstances(instances)
		} catch (err) {
			console.error('Fehler beim Laden der Formular-Instanzen:', err)
			setError(err instanceof Error ? err : new Error('Unbekannter Fehler'))
			setFormInstances([])
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, form.documentId])

	useEffect(() => {
		void loadFormInstances()
	}, [loadFormInstances])

	const formatDate = useCallback((dateString: string | null | undefined) => {
		if (!dateString) {
			return 'N/A'
		}

		try {
			return new Date(dateString).toLocaleDateString('de-DE', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
			})
		} catch {
			return dateString
		}
	}, [])

	const formatValue = useCallback((value: unknown): string => {
		if (value === null || value === undefined) {
			return '-'
		}
		if (typeof value === 'boolean') {
			return value ? 'Ja' : 'Nein'
		}
		if (typeof value === 'object') {
			return JSON.stringify(value)
		}
		return String(value)
	}, [])

	const formatValueForCSV = useCallback((value: unknown): string => {
		if (value === null || value === undefined) {
			return ''
		}
		if (typeof value === 'boolean') {
			return value ? 'Ja' : 'Nein'
		}
		if (typeof value === 'object') {
			return JSON.stringify(value).replace(/"/g, '""')
		}
		const stringValue = String(value)
		// Escape Anführungszeichen für CSV
		return stringValue.replace(/"/g, '""')
	}, [])

	const handleDownloadCSV = useCallback(() => {
		if (formInstances.length === 0) {
			return
		}

		// Erstelle CSV-Header
		const headers = ['Nr.', 'Erstellt', ...fieldNames]
		const csvRows: string[] = []

		// Header-Zeile
		csvRows.push(headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','))

		// Daten-Zeilen
		formInstances.forEach((instance, index) => {
			const row: string[] = [
				String(index + 1),
				'"' + (instance.createdAt ? formatDate(instance.createdAt) : '') + '"',
			]

			fieldNames.forEach((fieldName) => {
				const fields = instance.Content?.fields as Record<string, unknown> | undefined
				const value = fields?.[fieldName]
				row.push(`"${formatValueForCSV(value)}"`)
			})

			csvRows.push(row.join(','))
		})

		// Erstelle CSV-String
		const csvContent = csvRows.join('\n')

		// Erstelle Blob und Download
		const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
		const link = document.createElement('a')
		const url = URL.createObjectURL(blob)
		link.setAttribute('href', url)
		link.setAttribute('download', `${form.Name || 'form-instances'}-${new Date().toISOString().split('T')[0]}.csv`)
		link.style.visibility = 'hidden'
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}, [formInstances, fieldNames, form.Name, formatValueForCSV, formatDate])

	if (error) {
		return (
			<Box className='mb-4 rounded bg-red-50 p-4 text-sm text-red-800'>
				{error.message}
			</Box>
		)
	}

	return (
		<Box className='flex flex-col gap-4 py-4'>
			<Box className='flex items-center justify-between mb-4'>
				<Typography variant='h5' className='font-bold text-gray-900'>
					{form.Name || 'Unbenanntes Formular'}
				</Typography>
				{formInstances.length > 0 && !isLoading ? (
					<Box sx={{ display: 'flex', gap: 2 }}>
						<Button
							variant='contained'
							startIcon={<PrintIcon />}
							onClick={() => {
								window.open(`/printable-form-instance/${form.documentId}`, '_blank')
							}}
							sx={{
								backgroundColor: theme?.buttonColor || 'var(--color-action-primary)',
								color: theme?.buttonTextColor || 'var(--color-action-primary-text)',
								borderRadius: '999px',
								padding: '6px 24px',
								textTransform: 'none',
								fontSize: '1.15rem',
								fontWeight: 400,
								boxShadow: 'none',
								border: `1px solid ${theme?.buttonColor || 'var(--color-action-primary)'}`,
								'&:hover': {
									backgroundColor: theme?.buttonHoverColor || 'var(--color-action-main-hover)',
									borderColor: theme?.buttonHoverColor || 'var(--color-action-main-hover)',
									boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
									color: '#fff',
								},
							}}
						>
							Druckansicht
						</Button>
						<Button
							variant='contained'
							startIcon={<DownloadIcon />}
							onClick={handleDownloadCSV}
							sx={{
								backgroundColor: theme?.buttonColor || 'var(--color-action-primary)',
								color: theme?.buttonTextColor || 'var(--color-action-primary-text)',
								borderRadius: '999px',
								padding: '6px 24px',
								textTransform: 'none',
								fontSize: '1.15rem',
								fontWeight: 400,
								boxShadow: 'none',
								border: `1px solid ${theme?.buttonColor || 'var(--color-action-primary)'}`,
								'&:hover': {
									backgroundColor: theme?.buttonHoverColor || 'var(--color-action-main-hover)',
									borderColor: theme?.buttonHoverColor || 'var(--color-action-main-hover)',
									boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
									color: '#fff',
								},
							}}
						>
							Download CSV
						</Button>
					</Box>
				) : null}
			</Box>

			{isLoading ? (
				<Box className='flex justify-center py-8'>
					<CircularProgress />
				</Box>
			) : formInstances.length === 0 ? (
				<Paper className='p-6 text-center text-gray-500'>
					<Typography>Keine Formular-Instanzen gefunden.</Typography>
				</Paper>
			) : (
				<TableContainer component={Paper} sx={{ boxShadow: 2, overflowX: 'auto' }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 600 }}>Nr.</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Erstellt</TableCell>
								{fieldNames.map((fieldName) => (
									<TableCell key={fieldName} sx={{ fontWeight: 600 }}>
										{fieldName}
									</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{formInstances.map((instance, index) => (
								<TableRow key={instance.documentId} hover>
									<TableCell>
										<Typography variant='body2' className='text-gray-600'>
											{index + 1}
										</Typography>
									</TableCell>
									<TableCell>
										<Typography variant='body2' className='text-gray-600'>
											{formatDate(instance.createdAt)}
										</Typography>
									</TableCell>
									{fieldNames.map((fieldName) => {
										const fields = instance.Content?.fields as Record<string, unknown> | undefined
										const value = fields?.[fieldName]
										return (
											<TableCell key={fieldName}>
												<Typography variant='body2' sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
													{formatValue(value)}
												</Typography>
											</TableCell>
										)
									})}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Box>
	)
}


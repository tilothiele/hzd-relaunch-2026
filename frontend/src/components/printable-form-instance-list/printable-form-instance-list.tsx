'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, CircularProgress, Divider, Button } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import { fetchGraphQL } from '@/lib/graphql-client'
import { COUNT_FORM_INSTANCES } from '@/lib/graphql/queries'
import type { Form, FormInstance, FormInstanceSearchResult } from '@/types'

interface PrintableFormInstanceListProps {
	form: Form
	strapiBaseUrl: string
}

export function PrintableFormInstanceList({ form, strapiBaseUrl }: PrintableFormInstanceListProps) {
	const [formInstances, setFormInstances] = useState<FormInstance[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	// Extrahiere alle Feldnamen aus den FormFields
	const fieldNames = useMemo(() => {
		if (!form.FormFields) {
			return []
		}

		const names: Array<{ name: string; label: string }> = []
		for (const field of form.FormFields) {
			if (field.__typename === 'ComponentFormShortTextInput' && field.STName) {
				names.push({ name: field.STName, label: field.STName })
			} else if (field.__typename === 'ComponentFormEmailAdress' && field.EAName) {
				names.push({ name: field.EAName, label: field.EAName })
			} else if (field.__typename === 'ComponentFormTextArea' && field.TAName) {
				names.push({ name: field.TAName, label: field.TAName })
			} else if (field.__typename === 'ComponentFormNumberInput' && field.NIName) {
				names.push({ name: field.NIName, label: field.NIName })
			} else if (field.__typename === 'ComponentFormChoice' && field.CName) {
				names.push({ name: field.CName, label: field.CName })
			} else if (field.__typename === 'ComponentFormBooleanChoice' && field.BCName) {
				names.push({ name: field.BCName, label: field.BCName })
			} else if (field.__typename === 'ComponentFormStandardIdentifiers') {
				// StandardIdentifiers haben mehrere Felder
				if (field.FirstName && field.FirstName !== 'Nein') {
					names.push({ name: 'firstName', label: 'Vorname' })
				}
				if (field.LastName && field.LastName !== 'Nein') {
					names.push({ name: 'lastName', label: 'Nachname' })
				}
				if (field.EMail && field.EMail !== 'Nein') {
					names.push({ name: 'email', label: 'E-Mail' })
				}
				if (field.Street && field.Street !== 'Nein') {
					names.push({ name: 'street', label: 'Straße' })
				}
				if (field.Zip && field.Zip !== 'Nein') {
					names.push({ name: 'zip', label: 'PLZ' })
				}
				if (field.City && field.City !== 'Nein') {
					names.push({ name: 'city', label: 'Ort' })
				}
				if (field.CountryCode && field.CountryCode !== 'Nein') {
					names.push({ name: 'countryCode', label: 'Ländercode' })
				}
				if (field.Phone && field.Phone !== 'Nein') {
					names.push({ name: 'phone', label: 'Telefon' })
				}
				if (field.MembershipNumber && field.MembershipNumber !== 'Nein') {
					names.push({ name: 'membershipNumber', label: 'Mitgliedsnummer' })
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

	if (error) {
		return (
			<Box className='p-4'>
				<Typography variant='body1' className='text-red-600'>
					Fehler: {error.message}
				</Typography>
			</Box>
		)
	}

	const handlePrint = useCallback(() => {
		window.print()
	}, [])

	return (
		<Box sx={{ padding: 3, '@media print': { padding: 2 } }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, '@media print': { display: 'none' } }}>
				<Typography variant='h4' className='font-bold'>
					{form.Name || 'Unbenanntes Formular'}
				</Typography>
				<Button
					variant='contained'
					startIcon={<PrintIcon />}
					onClick={handlePrint}
					sx={{
						backgroundColor: '#facc15',
						color: '#565757',
						'&:hover': {
							backgroundColor: '#e6b800',
						},
					}}
				>
					Drucken
				</Button>
			</Box>
			
			{/* Titel für Druckansicht (nur beim Drucken sichtbar) */}
			<Typography 
				variant='h4' 
				className='font-bold' 
				sx={{ 
					marginBottom: 3,
					display: 'none',
					'@media print': { 
						display: 'block',
						pageBreakAfter: 'avoid',
					} 
				}}
			>
				{form.Name || 'Unbenanntes Formular'}
			</Typography>

			{isLoading ? (
				<Box className='flex justify-center py-8'>
					<CircularProgress />
				</Box>
			) : formInstances.length === 0 ? (
				<Typography variant='body1' className='text-gray-500'>
					Keine Formular-Instanzen gefunden.
				</Typography>
			) : (
				<Box>
					{formInstances.map((instance, index) => {
						const fields = instance.Content?.fields as Record<string, unknown> | undefined
						return (
							<Box key={instance.documentId}>
								{index > 0 && (
									<Divider sx={{ marginY: 4, borderWidth: 2, borderColor: '#000' }} />
								)}
								
								<Box sx={{ marginBottom: 3 }}>
									<Typography variant='h6' className='mb-3 font-semibold'>
										Anmeldung #{index + 1}
									</Typography>
									
									<Box sx={{ marginBottom: 2 }}>
										<Typography variant='body2' className='text-gray-600'>
											<strong>Erstellt am:</strong> {formatDate(instance.createdAt)}
										</Typography>
									</Box>

									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
										{fieldNames.map((field) => {
											const value = fields?.[field.name]
											return (
												<Box key={field.name} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
													<Typography variant='body2' className='font-semibold text-gray-700'>
														{field.label}:
													</Typography>
													<Typography variant='body1' className='text-gray-900'>
														{formatValue(value)}
													</Typography>
												</Box>
											)
										})}
									</Box>
								</Box>
							</Box>
						)
					})}
				</Box>
			)}
		</Box>
	)
}


'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
	Box,
	Button,
	Typography,
	FormControlLabel,
	Checkbox,
	Link,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { Form, FormSubmitButton, Image, StandardIdentifier } from '@/types'
import { renderFormField } from './form-field-renderer'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { renderStrapiBlocks } from '@/lib/strapi-blocks'
import { useAuth } from '@/hooks/use-auth'

interface FormComponentProps {
	form: Form
	privacyPolicy?: Image | null
	strapiBaseUrl?: string | null
}

export function FormComponent({ form, privacyPolicy, strapiBaseUrl }: FormComponentProps) {
	const router = useRouter()
	const { isAuthenticated, authState } = useAuth(strapiBaseUrl)
	const [values, setValues] = useState<Record<string, unknown>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showThankYouModal, setShowThankYouModal] = useState(false)
	const privacyPolicyUrl = resolveMediaUrl(privacyPolicy, strapiBaseUrl)

	// Fülle StandardIdentifiers-Felder mit User-Daten aus authState
	useEffect(() => {
		if (!isAuthenticated || !authState?.user) {
			return
		}

		const user = authState.user

		// Finde StandardIdentifiers-Feld im Formular
		const standardIdentifierField = form.FormFields?.find(
			(field): field is StandardIdentifier => field.__typename === 'ComponentFormStandardIdentifiers',
		)

		if (!standardIdentifierField) {
			return
		}

		// Fülle die Werte basierend auf den StandardIdentifiers-Feldern
		const newValues: Record<string, unknown> = {}

		if (standardIdentifierField.FirstName && standardIdentifierField.FirstName !== 'Nein' && user.firstName) {
			newValues.firstName = user.firstName
		}
		if (standardIdentifierField.LastName && standardIdentifierField.LastName !== 'Nein' && user.lastName) {
			newValues.lastName = user.lastName
		}
		if (standardIdentifierField.EMail && standardIdentifierField.EMail !== 'Nein' && user.email) {
			newValues.email = user.email
		}
		if (standardIdentifierField.Street && standardIdentifierField.Street !== 'Nein' && user.address1) {
			newValues.street = user.address1
		}
		if (standardIdentifierField.Zip && standardIdentifierField.Zip !== 'Nein' && user.zip) {
			newValues.zip = user.zip
		}
		if (standardIdentifierField.City && standardIdentifierField.City !== 'Nein' && user.city) {
			newValues.city = user.city
		}
		if (standardIdentifierField.CountryCode && standardIdentifierField.CountryCode !== 'Nein' && user.countryCode) {
			newValues.countryCode = user.countryCode
		}
		if (standardIdentifierField.Phone && standardIdentifierField.Phone !== 'Nein' && user.phone) {
			newValues.phone = user.phone
		}

		// Aktualisiere die Werte nur, wenn neue Daten vorhanden sind und die Felder noch nicht befüllt sind
		if (Object.keys(newValues).length > 0) {
			setValues((prev) => {
				const updated: Record<string, unknown> = { ...prev }
				// Nur Werte setzen, die noch nicht vorhanden sind
				Object.entries(newValues).forEach(([key, value]) => {
					if (!updated[key] || updated[key] === '') {
						updated[key] = value
					}
				})
				return updated
			})
		}
	}, [isAuthenticated, authState?.user, form.FormFields])

	const handleCloseModal = useCallback(() => {
		setShowThankYouModal(false)
		router.push('/calendar')
	}, [router])

	const handleChange = useCallback((name: string, value: unknown) => {
		setValues((prev) => ({
			...prev,
			[name]: value,
		}))
	}, [])

	const handleSubmit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			setIsSubmitting(true)

			try {
				// Bereinige die Werte: entferne abschließende Kommas und Newlines
				const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
					if (typeof value === 'string') {
						// Entferne abschließende Kommas und Newlines
						acc[key] = value.replace(/,\s*\n?$/, '').trim()
					} else {
						acc[key] = value
					}
					return acc
				}, {} as Record<string, unknown>)

				const formData = {
					formId: form.documentId,
					formName: form.Name,
					fields: cleanedValues,
				}

				const response = await fetch('/api/forms/submit', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						documentId: form.documentId,
						formData,
					}),
				})

				if (!response.ok) {
					const errorData = await response.json().catch(() => null)
					const errorMessage = errorData?.error?.message ?? `Fehler beim Absenden des Formulars (Status: ${response.status})`
					throw new Error(errorMessage)
				}

				// Formular erfolgreich abgesendet - Modal anzeigen
				setShowThankYouModal(true)
			} catch (error) {
				console.error('Fehler beim Absenden des Formulars:', error)
				// TODO: Fehler-Meldung anzeigen
			} finally {
				setIsSubmitting(false)
			}
		},
		[values, form],
	)

	const submitButton = form.FormFields?.find(
		(field): field is FormSubmitButton => field.__typename === 'ComponentFormFormSubmitButton',
	)

	const isPrivacyPolicyRequired = form.InclPrivacyPolicy && privacyPolicyUrl
	const isPrivacyPolicyAccepted = (values['privacyPolicyAccepted'] as boolean) ?? false
	const canSubmit = !isPrivacyPolicyRequired || isPrivacyPolicyAccepted

	return (
		<Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			{form.Name ? (
				<Typography variant='h4' component='h1' sx={{ mb: 2 }}>
					{form.Name}
				</Typography>
			) : null}

			{form.FormFields?.map((field, index) => renderFormField(field, index, values, handleChange))}

			{form.InclPrivacyPolicy && privacyPolicyUrl ? (
				<FormControlLabel
					control={
						<Checkbox
							checked={(values['privacyPolicyAccepted'] as boolean) ?? false}
							onChange={(e) => handleChange('privacyPolicyAccepted', e.target.checked)}
							name='privacyPolicyAccepted'
							required
						/>
					}
					label={
						<>
							Ich stimme der{' '}
							<Link href={privacyPolicyUrl} target='_blank' rel='noopener noreferrer' underline='hover'>
								Datenschutzerklärung
							</Link>{' '}
							zu
						</>
					}
					sx={{ mt: 1 }}
				/>
			) : null}

			{submitButton ? (
				<Button
					type='submit'
					variant='contained'
					disabled={isSubmitting || !canSubmit}
					sx={{ mt: 2, alignSelf: 'flex-start' }}
				>
					{isSubmitting ? 'Wird gesendet...' : submitButton.FSBName ?? 'Absenden'}
				</Button>
			) : (
				<Button
					type='submit'
					variant='contained'
					disabled={isSubmitting || !canSubmit}
					sx={{ mt: 2, alignSelf: 'flex-start' }}
				>
					{isSubmitting ? 'Wird gesendet...' : 'Absenden'}
				</Button>
			)}

			<Dialog
				open={showThankYouModal}
				onClose={handleCloseModal}
				maxWidth='sm'
				fullWidth
				disableAutoFocus
				disableEnforceFocus
			>
				<DialogTitle>
					Vielen Dank!
					<IconButton
						aria-label='close'
						onClick={handleCloseModal}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							color: (theme) => theme.palette.grey[500],
						}}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					{form.ThankYouMessage ? (
						<Box
							sx={{
								'& p': { mb: 2 },
								'& p:last-child': { mb: 0 },
							}}
							dangerouslySetInnerHTML={{
								__html: renderStrapiBlocks(form.ThankYouMessage),
							}}
						/>
					) : (
						<Typography>Ihr Formular wurde erfolgreich abgesendet.</Typography>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseModal} variant='contained'>
						Schließen
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}


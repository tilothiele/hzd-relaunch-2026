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
import type {
	Form,
	FormSubmitButton,
	Image,
	StandardIdentifier,
	DogStandardIdentifier,
	ShortTextInput,
	EmailAddress,
	TextArea,
	NumberInput,
	Choice,
	BooleanChoice,
	FormField,
} from '@/types'
import { renderFormField } from './form-field-renderer'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { renderStrapiBlocks } from '@/lib/strapi-blocks'
import { AltchaField } from '@/components/altcha/altcha-field'
import { RequiredFieldsNote } from '@/components/form/required-fields-note'
import { useAuth } from '@/hooks/use-auth'
import { theme } from '@/themes'
import { trackUmamiEvent } from '@/components/analytics/track-umami-event'

const FORM_SUBMIT_EVENT = 'form-submit'

interface FormComponentProps {
	form: Form
	privacyPolicy?: Image | null
	strapiBaseUrl?: string | null
}

function resolveSuccessTarget(raw: string | null | undefined): {
	href: string
	external: boolean
} | null {
	const trimmed = raw?.trim()
	if (!trimmed) {
		return null
	}

	const toTarget = (url: URL): { href: string; external: boolean } => {
		if (typeof window !== 'undefined' && url.origin === window.location.origin) {
			return {
				href: `${url.pathname}${url.search}${url.hash}`,
				external: false,
			}
		}

		return {
			href: url.href,
			external: true,
		}
	}

	if (trimmed.startsWith('//')) {
		try {
			return toTarget(new URL(`https:${trimmed}`))
		} catch {
			return null
		}
	}

	if (/^https?:\/\//i.test(trimmed)) {
		try {
			return toTarget(new URL(trimmed))
		} catch {
			return null
		}
	}

	const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
	return {
		href: path,
		external: false,
	}
}

// Prüft, ob in einem Eingabefeld tatsächlich ein Wert eingetragen ist.
function isValueSet(value: unknown): boolean {
	if (value === null || value === undefined) {
		return false
	}
	if (typeof value === 'string') {
		return value.trim() !== ''
	}
	if (typeof value === 'boolean') {
		return value
	}
	if (typeof value === 'number') {
		return Number.isFinite(value)
	}
	if (Array.isArray(value)) {
		return value.length > 0
	}
	return false
}

interface InputFieldEntry {
	key: string
	required: boolean
}

// Sammelt alle tatsächlich dargestellten Eingabefelder und markiert, ob es sich
// um ein Pflichtfeld (required) handelt. Nicht-pflichtige Felder gelten als
// "freiwillige Angaben".
function getInputFieldEntries(fields: FormField[] | null | undefined): InputFieldEntry[] {
	if (!fields) {
		return []
	}

	const entries: InputFieldEntry[] = []
	const add = (key: string | null | undefined, required: boolean) => {
		if (key) {
			entries.push({ key, required })
		}
	}

	for (const field of fields) {
		switch (field.__typename) {
			case 'ComponentFormShortTextInput': {
				const f = field as ShortTextInput
				add(f.STName ?? f.id, !!(f.MinLength && f.MinLength > 0))
				break
			}
			case 'ComponentFormEmailAdress': {
				const f = field as EmailAddress
				add(f.EAName ?? f.id, !!f.EARequired)
				break
			}
			case 'ComponentFormTextArea': {
				const f = field as TextArea
				// TextArea besitzt keinen Required-Flag, daher immer freiwillig
				add(f.TAName ?? f.id, false)
				break
			}
			case 'ComponentFormNumberInput': {
				const f = field as NumberInput
				add(f.NIName ?? f.id, !!f.NIRequired)
				break
			}
			case 'ComponentFormChoice': {
				const f = field as Choice
				add(f.CName ?? f.id, !!f.CRequired)
				break
			}
			case 'ComponentFormBooleanChoice': {
				const f = field as BooleanChoice
				add(f.BCName ?? f.id, !!f.BCRequired)
				break
			}
			case 'ComponentFormStandardIdentifiers': {
				const f = field as StandardIdentifier
				const sub: Array<{ key: string; status: 'Erforderlich' | 'Ja' | 'Nein' | null | undefined }> = [
					{ key: 'membershipNumber', status: f.MembershipNumber },
					{ key: 'firstName', status: f.FirstName },
					{ key: 'lastName', status: f.LastName },
					{ key: 'street', status: f.Street },
					{ key: 'zip', status: f.Zip },
					{ key: 'city', status: f.City },
					{ key: 'countryCode', status: f.CountryCode },
					{ key: 'phone', status: f.Phone },
					{ key: 'email', status: f.EMail },
				]
				for (const s of sub) {
					// Feld wird nur dargestellt, wenn Status gesetzt und != 'Nein'
					if (s.status && s.status !== 'Nein') {
						add(s.key, s.status === 'Erforderlich')
					}
				}
				break
			}
			case 'ComponentFormDogStandardIdentifier': {
				const f = field as DogStandardIdentifier
				const sub: Array<{ key: string; status: 'Erforderlich' | 'Ja' | 'Nein' | null | undefined }> = [
					{ key: 'dogGivenName', status: f.GivenName },
					{ key: 'dogKennelName', status: f.KennelName },
					{ key: 'dogChipNo', status: f.ChipNo },
					{ key: 'dogZuchtbuchnummer', status: f.Zuchtbuchnummer },
					{ key: 'dogDateOfBirth', status: f.DateOfBirth },
				]
				for (const s of sub) {
					if (s.status && s.status !== 'Nein') {
						add(s.key, s.status === 'Erforderlich')
					}
				}
				break
			}
			default:
				break
		}
	}

	return entries
}

export function FormComponent({
	form,
	privacyPolicy,
	strapiBaseUrl,
}: FormComponentProps) {
	const router = useRouter()
	const { isAuthenticated, authState } = useAuth()
	const [values, setValues] = useState<Record<string, unknown>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [altchaVerified, setAltchaVerified] = useState(false)
	const [altchaReset, setAltchaReset] = useState(0)
	const [showThankYouModal, setShowThankYouModal] = useState(false)
	const [isHovered, setIsHovered] = useState(false)
	const privacyPolicyUrl = resolveMediaUrl(privacyPolicy, strapiBaseUrl)

	// Pflichtangaben (bestehende Datenschutz-Checkbox)
	const isPrivacyPolicyRequired = form.InclPrivacyPolicy && privacyPolicyUrl
	const isPrivacyPolicyAccepted = (values['privacyPolicyAccepted'] as boolean) ?? false

	// Freiwillige Angaben: nur dargestellte Eingabefelder ohne "required"
	const voluntaryFieldKeys = getInputFieldEntries(form.FormFields)
		.filter((entry) => !entry.required)
		.map((entry) => entry.key)
	const hasVoluntaryFields = voluntaryFieldKeys.length > 0
	const hasVoluntaryData = voluntaryFieldKeys.some((key) => isValueSet(values[key]))

	// Checkbox für freiwillige Angaben:
	// - nur sichtbar, wenn Datenschutz aktiv ist UND es freiwillige Felder gibt
	// - deaktiviert, wenn keine freiwilligen Daten eingetragen sind
	// - enabled, sobald freiwillige Daten eingetragen sind
	const showVoluntaryCheckbox = !!isPrivacyPolicyRequired && hasVoluntaryFields
	const voluntaryCheckboxEnabled = hasVoluntaryData
	const isVoluntaryAccepted = (values['voluntaryDataAccepted'] as boolean) ?? false

	const canSubmit =
		(!isPrivacyPolicyRequired || isPrivacyPolicyAccepted) &&
		(!showVoluntaryCheckbox || !voluntaryCheckboxEnabled || isVoluntaryAccepted) &&
		altchaVerified

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
		if (standardIdentifierField.EMail && standardIdentifierField.EMail !== 'Nein' && user.cEmail) {
			newValues.email = user.cEmail
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
		const target = resolveSuccessTarget(form.SuccessUrl)
		if (!target) {
			return
		}

		if (target.external) {
			window.location.assign(target.href)
			return
		}

		router.push(target.href)
	}, [form.SuccessUrl, router])

	const handleChange = useCallback((name: string, value: unknown) => {
		setValues((prev) => ({
			...prev,
			[name]: value,
		}))
	}, [])

	const handleSubmit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault()
			setSubmitError(null)
			if (!altchaVerified) {
				setSubmitError('Bitte bestätigen Sie, dass Sie kein automatisiertes Programm sind.')
				return
			}
			if (showVoluntaryCheckbox && voluntaryCheckboxEnabled && !isVoluntaryAccepted) {
				setSubmitError('Bitte akzeptieren Sie die Verarbeitung Ihrer freiwilligen Angaben.')
				return
			}
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

				// Zustand der Checkbox für freiwillige Angaben in den Daten aufzeichnen
				if (showVoluntaryCheckbox) {
					cleanedValues['voluntaryDataAccepted'] = isVoluntaryAccepted
				}

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

				// Formular erfolgreich abgesendet - Umami-Event erfassen
				trackUmamiEvent(FORM_SUBMIT_EVENT, { name: form.Name ?? '' })

				// Formular erfolgreich abgesendet - Modal anzeigen
				setShowThankYouModal(true)
			} catch (error) {
				console.error('Fehler beim Absenden des Formulars:', error)
				setSubmitError(
					error instanceof Error
						? error.message
						: 'Formular konnte nicht abgesendet werden.',
				)
			} finally {
				setIsSubmitting(false)
				setAltchaReset((current) => current + 1)
			}
		},
		[altchaVerified, values, form, showVoluntaryCheckbox, voluntaryCheckboxEnabled, isVoluntaryAccepted],
	)

	const submitButton = form.FormFields?.find(
		(field): field is FormSubmitButton => field.__typename === 'ComponentFormFormSubmitButton',
	)

	return (
		<Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			{form.Name ? (
				<Typography variant='h4' component='h1' sx={{ mb: 2 }}>
					{form.Name}
				</Typography>
			) : null}

			<RequiredFieldsNote />

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
							Ich akzeptiere hiermit, dass meine Daten (Pflichteingaben) gemäß den{' '}
							<Link href={privacyPolicyUrl} target='_blank' rel='noopener noreferrer' underline='hover'>
								Datenschutzbestimmungen
							</Link>{' '}
							verarbeitet werden.
						</>
					}
					sx={{ mt: 1 }}
				/>
			) : null}

			{showVoluntaryCheckbox ? (
				<FormControlLabel
					control={
						<Checkbox
							checked={isVoluntaryAccepted}
							onChange={(e) => handleChange('voluntaryDataAccepted', e.target.checked)}
							name='voluntaryDataAccepted'
							disabled={!voluntaryCheckboxEnabled}
						/>
					}
					label={
						<>
							Ich akzeptiere hiermit, dass meine Daten (freiwillige Angaben) gemäß den{' '}
							<Link href={privacyPolicyUrl} target='_blank' rel='noopener noreferrer' underline='hover'>
								Datenschutzbestimmungen
							</Link>{' '}
							verarbeitet werden.
						</>
					}
					sx={{ mt: 1 }}
				/>
			) : null}

			<AltchaField
				onVerifiedChange={setAltchaVerified}
				resetSignal={altchaReset}
			/>

			{submitError ? (
				<Typography color='error' variant='body2'>
					{submitError}
				</Typography>
			) : null}

			{submitButton ? (
				<Button
					type='submit'
					variant='contained'
					disabled={isSubmitting || !canSubmit}
					sx={{
						mt: 2,
						alignSelf: 'flex-start',
						bgcolor: theme.submitButtonColor,
						color: theme.submitButtonTextColor,
						filter: isHovered ? 'brightness(90%)' : 'none',
						'&:hover': {
							bgcolor: theme.submitButtonColor,
						},
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					{isSubmitting ? 'Wird gesendet...' : submitButton.FSBName ?? 'Absenden'}
				</Button>
			) : (
				<Button
					type='submit'
					variant='contained'
					disabled={isSubmitting || !canSubmit}
					sx={{
						mt: 2,
						alignSelf: 'flex-start',
						bgcolor: theme.submitButtonColor,
						color: theme.submitButtonTextColor,
						filter: isHovered ? 'brightness(90%)' : 'none',
						'&:hover': {
							bgcolor: theme.submitButtonColor,
						},
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
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
					<Button
						onClick={handleCloseModal}
						variant='contained'
						sx={{
							bgcolor: theme.submitButtonColor,
							color: theme.submitButtonTextColor,
							'&:hover': {
								bgcolor: theme.submitButtonColor,
								filter: 'brightness(90%)',
							},
						}}
					>
						Schließen
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}


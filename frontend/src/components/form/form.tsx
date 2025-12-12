'use client'

import { useState, useCallback } from 'react'
import { Box, Button, Typography, FormControlLabel, Checkbox, Link } from '@mui/material'
import type { Form, FormSubmitButton, Image } from '@/types'
import { renderFormField } from './form-field-renderer'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface FormComponentProps {
	form: Form
	privacyPolicy?: Image | null
	strapiBaseUrl?: string | null
}

export function FormComponent({ form, privacyPolicy, strapiBaseUrl }: FormComponentProps) {
	const [values, setValues] = useState<Record<string, unknown>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const privacyPolicyUrl = resolveMediaUrl(privacyPolicy, strapiBaseUrl)

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
				const formData = {
					formId: form.documentId,
					formName: form.Name,
					fields: values,
				}
				console.log('Formular-Daten (JSON):', JSON.stringify(formData, null, 2))
			} catch (error) {
				console.error('Fehler beim Absenden des Formulars:', error)
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
							zu <Typography component='span' sx={{ color: 'error.main' }}>*</Typography>
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
		</Box>
	)
}


'use client'

import { useState, useCallback } from 'react'
import { Box, Button, Typography } from '@mui/material'
import type { Form, FormSubmitButton } from '@/types'
import { renderFormField } from './form-field-renderer'

interface FormComponentProps {
	form: Form
}

export function FormComponent({ form }: FormComponentProps) {
	const [values, setValues] = useState<Record<string, unknown>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

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

	return (
		<Box component='form' onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			{form.Name ? (
				<Typography variant='h4' component='h1' sx={{ mb: 2 }}>
					{form.Name}
				</Typography>
			) : null}

			{form.FormFields?.map((field, index) => renderFormField(field, index, values, handleChange))}

			{submitButton ? (
				<Button
					type='submit'
					variant='contained'
					disabled={isSubmitting}
					sx={{ mt: 2, alignSelf: 'flex-start' }}
				>
					{isSubmitting ? 'Wird gesendet...' : submitButton.FSBName ?? 'Absenden'}
				</Button>
			) : (
				<Button type='submit' variant='contained' disabled={isSubmitting} sx={{ mt: 2, alignSelf: 'flex-start' }}>
					{isSubmitting ? 'Wird gesendet...' : 'Absenden'}
				</Button>
			)}
		</Box>
	)
}


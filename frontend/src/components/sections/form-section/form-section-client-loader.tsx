'use client'

import { useEffect, useState } from 'react'
import { Box, CircularProgress } from '@mui/material'
import type { Form, FormSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { fetchFormByDocumentId } from '@/lib/strapi/api'
import { useGlobalLayout } from '@/hooks/use-global-layout'
import { FormSectionView } from './form-section'

interface FormSectionClientLoaderProps {
	section: FormSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

function unwrapForm(value: unknown): Form | null {
	if (!value || typeof value !== 'object') {
		return null
	}

	const record = value as Record<string, unknown>
	if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
		return record.data as Form
	}

	return value as Form
}

export function FormSectionClientLoader({
	section,
	strapiBaseUrl,
	theme,
}: FormSectionClientLoaderProps) {
	const populatedForm = unwrapForm(section.form)
	const documentId = populatedForm?.documentId
	const hasFields = Boolean(populatedForm?.FormFields?.length)
	const { globalLayout } = useGlobalLayout()
	const [form, setForm] = useState<Form | null>(hasFields ? populatedForm : null)
	const [isLoading, setIsLoading] = useState(!hasFields)

	useEffect(() => {
		if (!documentId || hasFields) {
			return
		}

		let cancelled = false
		setIsLoading(true)

		void fetchFormByDocumentId(documentId)
			.then((result) => {
				if (!cancelled) {
					setForm((result.forms[0] as unknown as Form | undefined) ?? populatedForm)
				}
			})
			.catch(() => {
				if (!cancelled) {
					setForm(populatedForm)
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoading(false)
				}
			})

		return () => {
			cancelled = true
		}
	}, [documentId, hasFields, populatedForm])

	if (isLoading) {
		return (
			<Box className='flex justify-center py-16'>
				<CircularProgress sx={{ color: theme.buttonColor }} />
			</Box>
		)
	}

	return (
		<FormSectionView
			form={form ?? populatedForm}
			privacyPolicy={globalLayout?.PrivacyPolicy ?? null}
			strapiBaseUrl={strapiBaseUrl}
			theme={theme}
			sectionId={section.id}
		/>
	)
}

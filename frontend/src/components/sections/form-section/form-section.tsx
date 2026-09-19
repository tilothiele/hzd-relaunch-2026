'use client'

import type { Form, Image } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { FormComponent } from '@/components/form/form'
import { Typography } from '@mui/material'

interface FormSectionViewProps {
	form: Form | null
	privacyPolicy?: Image | null
	strapiBaseUrl: string
	theme: ThemeDefinition
	sectionId?: string | number | null
}

export function FormSectionView({
	form,
	privacyPolicy,
	strapiBaseUrl,
	theme,
	sectionId,
}: FormSectionViewProps) {
	return (
		<SectionContainer
			variant='max-width'
			id={sectionId != null ? String(sectionId) : undefined}
			backgroundColor={theme.evenBgColor}
			paddingTop='3em'
			paddingBottom='3em'
		>
			{form ? (
				<FormComponent
					form={form}
					privacyPolicy={privacyPolicy}
					strapiBaseUrl={strapiBaseUrl}
				/>
			) : (
				<Typography className='text-center text-gray-600'>
					Formular konnte nicht geladen werden.
				</Typography>
			)}
		</SectionContainer>
	)
}

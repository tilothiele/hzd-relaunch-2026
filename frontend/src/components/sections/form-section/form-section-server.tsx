import type { Form, FormSection, Image } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { fetchFormByDocumentId } from '@/lib/strapi/api'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { FormSectionView } from './form-section'

interface FormSectionServerProps {
	section: FormSection
	strapiBaseUrl: string
	theme: ThemeDefinition
	privacyPolicy?: Image | null
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

export async function FormSectionServerComponent({
	section,
	strapiBaseUrl,
	theme,
	privacyPolicy,
}: FormSectionServerProps) {
	const populatedForm = unwrapForm(section.form)
	const documentId = populatedForm?.documentId

	let form = populatedForm
	if (documentId) {
		try {
			const result = await fetchFormByDocumentId(documentId, {
				server: true,
				token: process.env.STRAPI_API_TOKEN ?? null,
			})
			form = (result.forms[0] as unknown as Form | undefined) ?? populatedForm
		} catch {
			form = populatedForm
		}
	}

	let resolvedPrivacyPolicy = privacyPolicy ?? null
	if (resolvedPrivacyPolicy === null && form?.InclPrivacyPolicy) {
		try {
			const layout = await fetchGlobalLayout()
			resolvedPrivacyPolicy = layout.globalLayout?.PrivacyPolicy ?? null
		} catch {
			resolvedPrivacyPolicy = null
		}
	}

	return (
		<FormSectionView
			form={form}
			privacyPolicy={resolvedPrivacyPolicy}
			strapiBaseUrl={strapiBaseUrl}
			theme={theme}
			sectionId={section.id}
		/>
	)
}

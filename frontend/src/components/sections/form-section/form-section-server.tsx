import type { Form, FormSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { fetchFormByDocumentId } from '@/lib/strapi/api'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { pagePath } from '@/lib/page-path'
import { FormSectionView } from './form-section'

interface FormSectionServerProps {
	section: FormSection
	strapiBaseUrl: string
	theme: ThemeDefinition
	privacyPolicyHref?: string | null
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
	theme,
	privacyPolicyHref,
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

	let resolvedPrivacyPolicyHref = privacyPolicyHref ?? null
	if (resolvedPrivacyPolicyHref === null && form?.InclPrivacyPolicy) {
		try {
			const layout = await fetchGlobalLayout()
			resolvedPrivacyPolicyHref = pagePath(layout.globalLayout?.datenschutz)
		} catch {
			resolvedPrivacyPolicyHref = null
		}
	}

	return (
		<FormSectionView
			form={form}
			privacyPolicyHref={resolvedPrivacyPolicyHref}
			theme={theme}
			sectionId={section.id}
		/>
	)
}

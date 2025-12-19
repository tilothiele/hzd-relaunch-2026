import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { fetchGraphQLServer } from '@/lib/server/graphql-client'
import { GET_FORM_BY_DOCUMENT_ID } from '@/lib/graphql/queries'
import type { FormQueryResult } from '@/types'
import { PrintableFormInstanceList } from '@/components/printable-form-instance-list/printable-form-instance-list'

export const dynamic = 'force-dynamic'

interface PrintableFormInstanceFormIdPageProps {
	params: Promise<{
		formId: string
	}>
}

export default async function PrintableFormInstanceFormIdPage({ params }: PrintableFormInstanceFormIdPageProps) {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()

	const resolvedParams = await params
	const formId = resolvedParams.formId

	let form = null
	if (formId) {
		try {
			const formData = await fetchGraphQLServer<FormQueryResult>(
				GET_FORM_BY_DOCUMENT_ID,
				{
					baseUrl,
					variables: { documentId: formId },
				},
			)
			form = formData.forms?.[0] ?? null
		} catch (err) {
			console.error('Fehler beim Laden des Formulars:', err)
		}
	}

	if (error || !baseUrl) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{error?.message ?? 'Fehler beim Laden der Seite.'}</p>
			</div>
		)
	}

	return (
		<div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
			{form ? (
				<PrintableFormInstanceList form={form} strapiBaseUrl={baseUrl || ''} />
			) : (
				<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>Formular mit ID "{formId}" konnte nicht geladen werden.</p>
				</div>
			)}
		</div>
	)
}


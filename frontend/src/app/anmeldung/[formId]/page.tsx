import { MainPageStructure } from '../../main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { fetchFormByDocumentId } from '@/lib/strapi/api'
import { FormComponent } from '@/components/form/form'
import { SectionContainer } from '@/components/sections/section-container/section-container'

export const dynamic = 'force-dynamic'

interface AnmeldungFormIdPageProps {
	params: Promise<{
		formId: string
	}>
}

export default async function AnmeldungFormIdPage({ params }: AnmeldungFormIdPageProps) {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = globalTheme
	const pageTitle = 'Anmeldung'
	const resolvedParams = await params
	const formId = resolvedParams.formId
	const backgroundColor = theme.evenBgColor

	let form = null
	if (formId) {
		try {
			const formData = await fetchFormByDocumentId(formId, { server: true, baseUrl })
			form = (formData.forms?.[0] ?? null) as unknown as typeof form
		} catch (err) {
			console.error('Fehler beim Laden des Formulars:', err)
		}
	}

	if (error) {
		return (
			<MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl}>
				<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>{error.message ?? 'Fehler beim Laden der Seite.'}</p>
				</div>
			</MainPageStructure>
		)
	}

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle={pageTitle}
		>
			<SectionContainer
				variant='max-width'
				backgroundColor={backgroundColor}
				paddingTop='1em'
				paddingBottom='1em'
			>
				{form ? (
					<FormComponent
						form={form}
						privacyPolicy={globalLayout?.PrivacyPolicy ?? null}
						strapiBaseUrl={baseUrl}
					/>
				) : (
					<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
						<p>Formular mit ID "{formId}" konnte nicht geladen werden.</p>
					</div>
				)}
			</SectionContainer>
		</MainPageStructure>
	)
}


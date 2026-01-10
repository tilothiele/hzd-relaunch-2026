import { MainPageStructure } from '../../main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { fetchGraphQLServer } from '@/lib/server/graphql-client'
import { GET_CONTACT_BY_DOCUMENT_ID } from '@/lib/graphql/queries'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { ContactDetail } from '@/components/contact-detail/contact-detail'

export const dynamic = 'force-dynamic'

interface ContactIdPageProps {
	params: Promise<{
		id: string
	}>
}

interface ContactQueryResult {
	contact: {
		documentId: string
		position?: number | null
		Headline?: string | null
		Name?: string | null
		Street?: string | null
		ZipCity?: string | null
		Phone?: string | null
		Email1?: string | null
		Email2?: string | null
		Introduction?: string | null
		avatar?: {
			url: string
			alternativeText?: string | null
			width?: number | null
			height?: number | null
			caption?: string | null
			previewUrl?: string | null
		} | null
		member?: {
			documentId: string
			firstName?: string | null
			lastName?: string | null
		} | null
	} | null
}

export default async function ContactIdPage({ params }: ContactIdPageProps) {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = globalTheme
	const pageTitle = 'Kontakt'
	const resolvedParams = await params
	const contactId = resolvedParams.id
	const backgroundColor = theme.cardsBackground

	let contact = null
	if (contactId) {
		try {
			const contactData = await fetchGraphQLServer<ContactQueryResult>(
				GET_CONTACT_BY_DOCUMENT_ID,
				{
					baseUrl,
					variables: { documentId: contactId },
				},
			)
			contact = contactData.contact
		} catch (err) {
			console.error('Fehler beim Laden des Kontakts:', err)
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
				paddingTop='2em'
				paddingBottom='2em'
			>
				{contact ? (
					<ContactDetail contact={contact} strapiBaseUrl={baseUrl || ''} theme={theme} />
				) : (
					<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
						<p>Kontakt mit ID "{contactId}" konnte nicht geladen werden.</p>
					</div>
				)}
			</SectionContainer>
		</MainPageStructure>
	)
}





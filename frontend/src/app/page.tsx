import { MainPageStructure } from './main-page-structure'
import { theme as globalTheme } from '@/themes'
import { getStrapiBaseUrl } from '@/lib/server/strapi-client'
import { fetchLayoutServer, fetchMe } from '@/lib/strapi/api'
import { enrichSectionsWithSupplementalDocuments } from '@/lib/server/enrich-supplemental-sections'
import { renderServerSections } from '@/components/sections/server-section-factory'
import type { GlobalLayout, Page } from '@/types'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const dynamic = 'force-dynamic'

function resolveHomePage(
	globalLayout: GlobalLayout,
	isAuthenticated: boolean,
): Page | null | undefined {
	const defaultPage = globalLayout.page
	const authenticatedPage = globalLayout.authenticated_page
	const authSections = authenticatedPage?.Sections ?? []

	if (!isAuthenticated || authSections.length === 0) {
		return defaultPage
	}

	const hasOnlyRichTextSections = authSections.every(
		(section) => section.__typename === 'ComponentBlocksRichTextSection',
	)
	const defaultSections = defaultPage?.Sections ?? []
	const defaultHasStructuredSections = defaultSections.some(
		(section) => section.__typename !== 'ComponentBlocksRichTextSection',
	)

	if (hasOnlyRichTextSections && defaultHasStructuredSections) {
		return defaultPage
	}

	return authenticatedPage ?? defaultPage
}

export default async function Home() {
	let globalLayout: GlobalLayout | null = null
	let baseUrl: string = ''
	let error: Error | null = null
	let isAuthenticated = false

	try {
		baseUrl = getStrapiBaseUrl()
		const data = await fetchLayoutServer(baseUrl)
		globalLayout = data.globalLayout

		const session = await getServerSession(authOptions)
		const authToken = session?.idToken ?? session?.accessToken ?? null

		if (authToken) {
			const meData = await fetchMe(authToken, { server: true, baseUrl })
			isAuthenticated = Boolean(meData.me?.documentId)
		}
	} catch (err) {
		error = err instanceof Error ? err : new Error('Fehler beim Laden der Seite.')
	}

	const page = globalLayout
		? resolveHomePage(globalLayout, isAuthenticated)
		: null
	const sections = await enrichSectionsWithSupplementalDocuments(
		page?.Sections ?? [],
		baseUrl,
	)

	if (error) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{error.message ?? 'Fehler beim Laden der Seite.'}</p>
			</div>
		)
	}

	if (!globalLayout) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.</p>
			</div>
		)
	}

	const theme = globalTheme
	const renderedSections = renderServerSections({
		sections,
		strapiBaseUrl: baseUrl,
		theme,
		logo: globalLayout?.Logo,
		hzdSetting: globalLayout?.HzdSetting,
	})

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			logoBackground={page?.LogoBackground}
		>
			{renderedSections}
		</MainPageStructure>
	)
}

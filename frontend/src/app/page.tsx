import { MainPageStructure } from './main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchGraphQLServer, getStrapiBaseUrl } from '@/lib/server/graphql-client'
import { GET_LAYOUT } from '@/lib/graphql/queries'
import { renderServerSections } from '@/components/sections/server-section-factory'
import type { GlobalLayout } from '@/types'

export const dynamic = 'force-dynamic'

interface LayoutData {
	globalLayout: GlobalLayout
	hzdSetting?: GlobalLayout['HzdSetting']
	announcements?: GlobalLayout['announcements']
}

export default async function Home() {
	let globalLayout: GlobalLayout | null = null
	let baseUrl: string = ''
	let error: Error | null = null

	try {
		baseUrl = getStrapiBaseUrl()
		const data = await fetchGraphQLServer<LayoutData>(GET_LAYOUT, { baseUrl })
		globalLayout = data.globalLayout
		if (globalLayout) {
			globalLayout.HzdSetting = data.hzdSetting ?? null
			globalLayout.announcements = data.announcements ?? null
		}
	} catch (err) {
		error = err instanceof Error ? err : new Error('Fehler beim Laden der Seite.')
	}

	const sections = globalLayout?.page?.Sections ?? []

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
		hzdSetting: globalLayout?.HzdSetting
	})

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			logoBackground={globalLayout?.page?.LogoBackground}
		>
			{renderedSections}
		</MainPageStructure>
	)
}

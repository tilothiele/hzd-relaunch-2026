import { MainPageStructure } from './main-page-structure'
import { themes } from '@/themes'
import { fetchIndexPage } from '@/lib/server/fetch-index-page'
import { renderServerSections } from '@/components/sections/server-section-factory'

export const dynamic = 'force-dynamic'

export default async function Home() {
	const { globalLayout, baseUrl, error } = await fetchIndexPage()
	const sections = globalLayout?.Sections ?? []

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

	const theme = themes.A
	const renderedSections = renderServerSections({ sections, strapiBaseUrl: baseUrl, theme })

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
		>
			{renderedSections}
		</MainPageStructure>
	)
}

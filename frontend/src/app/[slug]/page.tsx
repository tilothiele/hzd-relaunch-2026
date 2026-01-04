import { MainPageStructure } from '../main-page-structure'
import { themes } from '@/themes'
import { fetchPageBySlug, fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { renderServerSections } from '@/components/sections/server-section-factory'
import NotFoundSection from '@/components/sections/not-found-section/not-found-section'

export const dynamic = 'force-dynamic'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

export default async function Page({ params }: PageProps) {
	const { slug } = await params

	if (!slug || slug.trim().length === 0) {
		// Lade Layout für 404-Seite
		const { globalLayout, baseUrl } = await fetchGlobalLayout()
		return (
			<MainPageStructure
				homepage={globalLayout}
				strapiBaseUrl={baseUrl}
				pageTitle='404 - Seite nicht gefunden'
			>
				<NotFoundSection />
			</MainPageStructure>
		)
	}

	const { page, globalLayout, baseUrl, error } = await fetchPageBySlug(slug.trim())

	if (error) {
		return (
			<MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl}>
				<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>{error.message ?? 'Fehler beim Laden der Seite.'}</p>
				</div>
			</MainPageStructure>
		)
	}

	if (!globalLayout) {
		return (
			<MainPageStructure homepage={null} strapiBaseUrl={baseUrl}>
				<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.</p>
				</div>
			</MainPageStructure>
		)
	}

	if (!page) {
		// Seite nicht gefunden - zeige schöne 404-Seite mit Layout
		return (
			<MainPageStructure
				homepage={globalLayout}
				strapiBaseUrl={baseUrl}
				pageTitle='404 - Seite nicht gefunden'
			>
				<NotFoundSection />
			</MainPageStructure>
		)
	}

	const sections = page.Sections || []
	const theme = themes[page.ColorTheme?.ShortName ?? 'A']
	const renderedSections = renderServerSections({
		sections,
		strapiBaseUrl: baseUrl,
		theme,
		logo: globalLayout?.Logo
	})

	return (
		<MainPageStructure
			homepage={globalLayout}
			theme={theme}
			strapiBaseUrl={baseUrl}
			pageTitle={page.title}
		>
			{renderedSections}
		</MainPageStructure>
	)
}

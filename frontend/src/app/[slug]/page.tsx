import Image from 'next/image'
import { MainPageStructure } from '../main-page-structure'
import { themes } from '@/themes'
import { fetchPageBySlug, fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { renderServerSections } from '@/components/sections/server-section-factory'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

function NotFoundSection() {
	return (
		<div className='flex w-full justify-center px-6 py-24'>
			<section className='grid min-h-[50vh] w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2'>
				<div className='flex items-center justify-center px-6' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
					<Image
						src='/static-images/404-not-found-wuff.jpg'
						alt='404 - Seite nicht gefunden'
						width={300}
						height={300}
						className='rounded-lg object-cover'
						unoptimized
					/>
				</div>
				<div className='flex flex-col items-center justify-center gap-6 px-6 text-center md:text-left'>
					<h1 className='text-4xl font-semibold tracking-tight text-neutral-900'>
						Seite nicht gefunden
					</h1>
					<p className='max-w-lg text-base text-neutral-600'>
						Die angeforderte Seite konnte nicht gefunden werden. Bitte prüfen Sie die
						URL oder kehren Sie zur Startseite zurück.
					</p>
				</div>
			</section>
		</div>
	)
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
	const renderedSections = renderServerSections({ sections, strapiBaseUrl: baseUrl, theme })

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

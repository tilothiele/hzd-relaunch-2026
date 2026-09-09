import { MainPageStructure } from '../main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchPageBySlug, fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { renderServerSections } from '@/components/sections/server-section-factory'
import NotFoundSection from '@/components/sections/not-found-section/not-found-section'
import AccessForbiddenSection from '@/components/sections/access-forbidden-section/access-forbidden-section'
import { AuthGuard } from '@/components/auth-guard/auth-guard'
import { StrictlyPrivatePage } from '@/components/auth/strictly-private-page'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params
	if (!slug || slug.trim().length === 0) {
		return {}
	}

	const { page } = await fetchPageBySlug(slug.trim())

	if (!page) {
		return {}
	}

	return {
		title: page.title,
	}
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

	/*
	 * Zugriff:
	 * 1. Public und keine user_groups → Seite frei
	 * 2. Weder Authenticated noch user_groups → immer verboten
	 * 3. Sonst AuthGuard: Login plus ggf. Schnittmenge der user_groups
	 */

	const restriction = page.Restriction
	const isPublicAccessible = restriction?.Public ?? true
	const isAuthenticatedRequired = restriction?.Authenticated ?? false
	const hasGroupRestriction = Boolean(restriction?.user_groups?.length)

	const sections = page.Sections || []
	const theme = globalTheme
	const renderedSections = renderServerSections({
		sections,
		strapiBaseUrl: baseUrl,
		theme,
		logo: globalLayout?.Logo
	})

	if (isPublicAccessible && !hasGroupRestriction) {
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

	if (!isAuthenticatedRequired && !hasGroupRestriction) {
		return (
			<MainPageStructure
				homepage={globalLayout}
				strapiBaseUrl={baseUrl}
				pageTitle='403 - Zugriff verweigert'
			>
				<StrictlyPrivatePage fallback={<AccessForbiddenSection />} />
			</MainPageStructure>
		)
	}

	return (
		<MainPageStructure
			homepage={globalLayout}
			theme={theme}
			strapiBaseUrl={baseUrl}
			pageTitle={page.title}
		>
			<AuthGuard
				restriction={restriction}
				fallback={<AccessForbiddenSection />}
			>
				{renderedSections}
			</AuthGuard>
		</MainPageStructure>
	)
}

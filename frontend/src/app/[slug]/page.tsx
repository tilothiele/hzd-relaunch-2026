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
	 * Logic for Access Control (Client-Side Check):
	 * 1. If page.Restriction exists:
	 *    a. If Public is true -> Access Allowed
	 *    b. If Public is false:
	 *       i. If Authenticated is true -> Check User Login via AuthGuard
	 *       ii. Else -> Forbidden (AccessForbiddenSection)
	 *
	 * Note: Since we are in a server component but auth is client-side, we must wrap sensitive content in AuthGuard if it requires authentication.
	 * If the page is strictly forbidden (neither public nor accessible via auth, which is rare but possible if Public=false and Authenticated=false),
	 * we show AccessForbiddenSection immediately.
	 */

	const isPublicAccessible = page.Restriction?.Public ?? true // Default to public if no restriction defined
	const isAuthenticatedRequired = page.Restriction?.Authenticated ?? false
	// const needsAuth = page.Restriction && !page.Restriction.Public && page.Restriction.Authenticated

	const sections = page.Sections || []
	const theme = globalTheme
	const renderedSections = renderServerSections({
		sections,
		strapiBaseUrl: baseUrl,
		theme,
		logo: globalLayout?.Logo
	})

	// If it's NOT public and NOT accessible via auth (e.g. strict internal only, or just disabled public access without auth fallback configured properly),
	// show forbidden immediately.
	// HOWEVER, usually "Authenticated" flag means "needs login".
	// If Public=false, usually Authenticated=true (or explicit group checks).

	// 1. Public Access -> Render immediately
	if (isPublicAccessible) {
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

	// 2. Strictly Private (Not Public, Not Authenticated) -> Forbidden
	// User requested to calculate isUserAuthenticated via hook here.
	if (!isAuthenticatedRequired) {
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

	// 3. Authenticated Access -> Wrap in AuthGuard
	return (
		<MainPageStructure
			homepage={globalLayout}
			theme={theme}
			strapiBaseUrl={baseUrl}
			pageTitle={page.title}
		>
			<AuthGuard fallback={<AccessForbiddenSection />}>
				{renderedSections}
			</AuthGuard>
		</MainPageStructure>
	)
}

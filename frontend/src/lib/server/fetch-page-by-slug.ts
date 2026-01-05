import { fetchGraphQLServer, getStrapiBaseUrl } from './graphql-client'
import { GET_PAGE_BY_SLUG, GET_LAYOUT } from '@/lib/graphql/queries'
import type { GlobalLayout, Page } from '@/types'

interface PageQueryResult {
	pages?: Page[] | null
}

interface LayoutData {
	globalLayout: GlobalLayout
	hzdSetting?: GlobalLayout['HzdSetting']
}

export interface PageBySlugResult {
	page: Page | null
	globalLayout: GlobalLayout | null
	baseUrl: string
	error: Error | null
}

/**
 * Lädt nur das Global Layout (ohne Page-Daten).
 * Nützlich für 404-Seiten, die das Layout benötigen.
 */
export async function fetchGlobalLayout(): Promise<{ globalLayout: GlobalLayout | null; baseUrl: string; error: Error | null }> {
	try {
		const baseUrl = getStrapiBaseUrl()
		const layoutData = await fetchGraphQLServer<LayoutData>(GET_LAYOUT, { baseUrl })

		if (layoutData.globalLayout) {
			layoutData.globalLayout.HzdSetting = layoutData.hzdSetting ?? null
		}

		return {
			globalLayout: layoutData.globalLayout,
			baseUrl,
			error: null,
		}
	} catch (err) {
		const error = err instanceof Error
			? err
			: new Error('Layout konnte nicht geladen werden.')

		return {
			globalLayout: null,
			baseUrl: getStrapiBaseUrl(),
			error,
		}
	}
}

/**
 * Ruft eine Seite anhand des Slugs serverseitig ab.
 * Kombiniert Page-Daten mit Layout-Daten.
 */
export async function fetchPageBySlug(slug: string): Promise<PageBySlugResult> {
	try {
		const baseUrl = getStrapiBaseUrl()
		const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`

		const [pageData, layoutData] = await Promise.all([
			fetchGraphQLServer<PageQueryResult>(
				GET_PAGE_BY_SLUG,
				{
					baseUrl,
					variables: { slug: normalizedSlug },
				},
			),
			fetchGraphQLServer<LayoutData>(GET_LAYOUT, { baseUrl }),
		])

		// Finde die passende Seite
		const matchingPage = pageData.pages?.find((entity) => {
			const entitySlug = entity?.slug
			return entitySlug?.toLowerCase() === normalizedSlug.toLowerCase()
		}) ?? null

		if (layoutData.globalLayout) {
			layoutData.globalLayout.HzdSetting = layoutData.hzdSetting ?? null
		}

		return {
			page: matchingPage,
			globalLayout: layoutData.globalLayout,
			baseUrl,
			error: null,
		}
	} catch (err) {
		const error = err instanceof Error
			? err
			: new Error('Seite konnte nicht geladen werden.')

		return {
			page: null,
			globalLayout: null,
			baseUrl: getStrapiBaseUrl(),
			error,
		}
	}
}


import { getStrapiBaseUrl } from './strapi-client'
import { fetchLayoutServer, fetchPagesBySlug } from '@/lib/strapi/api'
import type { GlobalLayout, Page } from '@/types'
import { enrichSectionsWithSupplementalDocuments } from './enrich-supplemental-sections'

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
		const layoutData = await fetchLayoutServer()

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
			fetchPagesBySlug(normalizedSlug, { server: true }),
			fetchLayoutServer(),
		])

		let matchingPage = pageData.pages?.find((entity) => {
			const entitySlug = entity?.slug
			return entitySlug?.toLowerCase() === normalizedSlug.toLowerCase()
		}) ?? null

		if (matchingPage?.Sections?.length) {
			matchingPage = {
				...matchingPage,
				Sections: await enrichSectionsWithSupplementalDocuments(
					matchingPage.Sections,
				),
			}
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

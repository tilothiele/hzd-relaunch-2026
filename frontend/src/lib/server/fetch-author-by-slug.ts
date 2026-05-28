import { getStrapiBaseUrl } from './strapi-client'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import { fetchEntityList } from '@/lib/strapi/api'
import { fetchGlobalLayout } from './fetch-page-by-slug'
import type { GlobalLayout, Author } from '@/types'

export interface AuthorBySlugResult {
	author: Author | null
	globalLayout: GlobalLayout | null
	baseUrl: string
	error: Error | null
}

export async function fetchAuthorBySlug(slug: string): Promise<AuthorBySlugResult> {
	try {
		const baseUrl = getStrapiBaseUrl()

		const query = buildStrapiQuery({
			filters: { Slug: { eq: slug } },
			pagination: { pageSize: 1 },
			populate: {
				'populate[Avatar]': '*',
				'populate[ExternalPublication]': '*',
			},
		})

		const [authors, layoutData] = await Promise.all([
			fetchEntityList<Author>('authors', query, { server: true, baseUrl }),
			fetchGlobalLayout(),
		])

		return {
			author: authors[0] ?? null,
			globalLayout: layoutData.globalLayout,
			baseUrl,
			error: null,
		}
	} catch (err) {
		const error = err instanceof Error
			? err
			: new Error('Autor konnte nicht geladen werden.')

		return {
			author: null,
			globalLayout: null,
			baseUrl: getStrapiBaseUrl(),
			error,
		}
	}
}

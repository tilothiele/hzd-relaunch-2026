import { getStrapiBaseUrl } from './strapi-client'
import { fetchLayoutServer, fetchNewsArticleBySlug as fetchNewsArticleBySlugApi } from '@/lib/strapi/api'
import type { GlobalLayout, NewsArticle } from '@/types'

export interface NewsArticleBySlugResult {
	article: NewsArticle | null
	globalLayout: GlobalLayout | null
	baseUrl: string
	error: Error | null
}

/**
 * Fetches a news article by its slug from the server.
 * Combines article data with global layout data.
 */
export async function fetchNewsArticleBySlug(slug: string): Promise<NewsArticleBySlugResult> {
	try {
		const baseUrl = getStrapiBaseUrl()

		const [articleData, layoutData] = await Promise.all([
			fetchNewsArticleBySlugApi(slug),
			fetchLayoutServer(),
		])

		const matchingArticle = (articleData.newsArticles?.[0] ?? null) as unknown as NewsArticle | null

		return {
			article: matchingArticle,
			globalLayout: layoutData.globalLayout,
			baseUrl,
			error: null,
		}
	} catch (err) {
		const error = err instanceof Error
			? err
			: new Error('Artikel konnte nicht geladen werden.')

		return {
			article: null,
			globalLayout: null,
			baseUrl: getStrapiBaseUrl(),
			error,
		}
	}
}

/**
 * Reuse the global layout fetcher from fetch-page-by-slug
 */
export { fetchGlobalLayout } from './fetch-page-by-slug'

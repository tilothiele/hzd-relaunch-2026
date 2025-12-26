import { fetchGraphQLServer, getStrapiBaseUrl } from './graphql-client'
import { GET_NEWS_ARTICLE_BY_SLUG, GET_LAYOUT } from '@/lib/graphql/queries'
import type { GlobalLayout, NewsArticle } from '@/types'

interface NewsArticleQueryResult {
    newsArticles?: NewsArticle[] | null
}

interface LayoutData {
    globalLayout: GlobalLayout
}

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
            fetchGraphQLServer<NewsArticleQueryResult>(
                GET_NEWS_ARTICLE_BY_SLUG,
                {
                    baseUrl,
                    variables: { slug },
                },
            ),
            fetchGraphQLServer<LayoutData>(GET_LAYOUT, { baseUrl }),
        ])

        // Get the first matching article (should only be one due to unique slug)
        const matchingArticle = articleData.newsArticles?.[0] ?? null

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

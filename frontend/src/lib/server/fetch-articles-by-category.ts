import { fetchGraphQLServer, getStrapiBaseUrl } from './graphql-client'
import { GET_NEWS_ARTICLE_CATEGORY_BY_SLUG, GET_NEWS_ARTICLES_BY_CATEGORY } from '@/lib/graphql/queries'
import type { NewsArticleCategory, NewsArticle } from '@/types'

interface CategoryQueryResult {
    newsArticleCategories?: NewsArticleCategory[] | null
}

interface ArticlesByCategoryResult {
    newsArticleCategories?: Array<{
        documentId: string
        news_articles: NewsArticle[]
    }> | null
}

/**
 * Fetches a news article category by its slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<NewsArticleCategory | null> {
    try {
        const baseUrl = getStrapiBaseUrl()
        const data = await fetchGraphQLServer<CategoryQueryResult>(
            GET_NEWS_ARTICLE_CATEGORY_BY_SLUG,
            {
                baseUrl,
                variables: { slug },
            },
        )

        return data.newsArticleCategories?.[0] ?? null
    } catch (error) {
        console.error('Error fetching category by slug:', error)
        return null
    }
}

/**
 * Fetches articles for a specific category with pagination
 */
export async function fetchArticlesByCategory({
    categoryId,
    page = 1,
    pageSize = 12,
    featuredFilter,
}: {
    categoryId: string
    page?: number
    pageSize?: number
    featuredFilter?: boolean | null
}): Promise<NewsArticle[]> {
    try {
        const baseUrl = getStrapiBaseUrl()

        const variables: any = {
            categoryId,
            pagination: {
                page,
                pageSize,
            },
            featuredFilter
        }

        const data = await fetchGraphQLServer<any>(
            GET_NEWS_ARTICLES_BY_CATEGORY,
            {
                baseUrl,
                variables,
            },
        )

        return data.newsArticles ?? []
    } catch (error) {
        console.error('Error fetching articles by category:', error)
        return []
    }
}

import { fetchGraphQLServer, getStrapiBaseUrl } from '@/lib/server/graphql-client'
import { GET_NEWS_ARTICLES } from '@/lib/graphql/queries'
import type { Image } from '@/types'

export interface NewsArticle {
    documentId: string
    Headline?: string | null
    SubHeadline?: string | null
    TeaserText?: string | null
    Slug?: string | null
    DateOfPublication?: string | null
    publishedAt?: string | null
    Image?: Image | null
    category?: {
        CategoryName?: string | null
    } | null
    news_article_tags?: {
        Label?: string | null
        TagColorHexCode?: string | null
        TagBgColorHexCode?: string | null
    }[] | null
}

interface NewsArticlesResponse {
    newsArticles: NewsArticle[]
}

export async function fetchNewsArticles({
    limit = 3,
    categoryDocumentId,
}: {
    limit?: number
    categoryDocumentId?: string
} = {}): Promise<NewsArticle[]> {
    const baseUrl = getStrapiBaseUrl()

    const filters: any = {}
    if (categoryDocumentId) {
        filters.category = { documentId: { eq: categoryDocumentId } }
    }

    try {
        const { newsArticles } = await fetchGraphQLServer<NewsArticlesResponse>(GET_NEWS_ARTICLES, {
            baseUrl,
            variables: { // Wrapped in variables
                filters,
                pagination: { limit },
                sort: ['publishedAt:desc'],
            }
        })

        return newsArticles
    } catch (error) {
        console.error('Error fetching news articles:', error)
        return []
    }
}

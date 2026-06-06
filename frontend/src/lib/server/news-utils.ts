import { fetchNewsArticles as fetchNewsArticlesApi } from '@/lib/strapi/api'
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
	SEO?: {
		author?: {
			DisplayName?: string | null
			FirstName?: string | null
			LastName?: string | null
			AcademicTitle?: string | null
			Slug?: string | null
		} | null
	} | null
	category?: {
		CategoryName?: string | null
	} | null
	news_article_tags?: {
		Label?: string | null
		TagColorHexCode?: string | null
		TagBgColorHexCode?: string | null
	}[] | null
}

export async function fetchNewsArticles({
	limit = 3,
	categoryDocumentId,
}: {
	limit?: number
	categoryDocumentId?: string
} = {}): Promise<NewsArticle[]> {
	const filters: Record<string, unknown> = {}
	if (categoryDocumentId) {
		filters.category = { documentId: { eq: categoryDocumentId } }
	}

	try {
		const { newsArticles } = await fetchNewsArticlesApi({
			filters,
			pagination: { pageSize: limit },
			sort: ['publishedAt:desc'],
		})

		return newsArticles as unknown as NewsArticle[]
	} catch (error) {
		console.error('Error fetching news articles:', error)
		return []
	}
}

import { searchNewsArticles } from '@/lib/strapi/api'
import { NEWS_ARTICLE_DEFAULT_SORT } from '@/lib/strapi/populate'
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
		documentId?: string
		Label?: string | null
		TagColorHexCode?: string | null
		TagBgColorHexCode?: string | null
	}[] | null
}

export async function fetchNewsArticles({
	limit = 3,
	categoryDocumentId,
	searchPhrase,
	newsArticleTagIds,
}: {
	limit?: number
	categoryDocumentId?: string
	searchPhrase?: string
	newsArticleTagIds?: string[]
} = {}): Promise<NewsArticle[]> {
	try {
		const { newsArticles } = await searchNewsArticles(
			{
				categoryDocumentId,
				searchPhrase,
				newsArticleTagIds,
				pageSize: limit,
				sort: [...NEWS_ARTICLE_DEFAULT_SORT],
			},
			{ server: true },
		)

		return newsArticles as unknown as NewsArticle[]
	} catch (error) {
		console.error('Error fetching news articles:', error)
		return []
	}
}

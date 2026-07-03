import { buildStrapiQuery } from '@/lib/strapi/filters'
import { fetchEntityList, fetchNewsArticles } from '@/lib/strapi/api'
import { normalizeSections } from '@/lib/strapi/normalize'
import { NEWS_ARTICLE_DEFAULT_SORT, POPULATE_NEWS_ARTICLE_CATEGORY } from '@/lib/strapi/populate'
import type { NewsArticleCategory, NewsArticle } from '@/types'

/**
 * Fetches a news article category by its slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<NewsArticleCategory | null> {
	try {
		const query = buildStrapiQuery({
			filters: { Slug: { eq: slug } },
			pagination: { pageSize: 1 },
			populate: Object.fromEntries(POPULATE_NEWS_ARTICLE_CATEGORY.entries()),
		})
		const categories = await fetchEntityList<NewsArticleCategory>(
			'news-article-categories',
			query,
			{ server: true },
		)

		const category = categories[0]
		if (!category) {
			return null
		}

		return {
			...category,
			ContentSections: normalizeSections(category.ContentSections),
		}
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
		const filters: Record<string, unknown> = {
			category: { documentId: { eq: categoryId } },
		}

		if (featuredFilter === false) {
			filters.or = [
				{ FeaturedArticle: { eq: false } },
				{ FeaturedArticle: { null: true } },
			]
		} else if (featuredFilter !== undefined && featuredFilter !== null) {
			filters.FeaturedArticle = { eq: featuredFilter }
		}

		const { newsArticles } = await fetchNewsArticles({
			filters,
			pagination: { page, pageSize },
			sort: [...NEWS_ARTICLE_DEFAULT_SORT],
		})

		return newsArticles as unknown as NewsArticle[]
	} catch (error) {
		console.error('Error fetching articles by category:', error)
		return []
	}
}

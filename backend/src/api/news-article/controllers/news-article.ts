/**
 * news-article controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../../../plugins/hzd-plugin/server/src/utils/document-pagination'

interface NewsArticleSearchQuery {
	categoryDocumentId?: string
	categorySlug?: string
	page?: string | number
	pageSize?: string | number
	sort?: string | string[]
}

const NEWS_ARTICLE_SECTION_SEARCH_POPULATE = {
	Image: true,
	category: {
		fields: ['documentId', 'CategoryName', 'Slug'],
	},
	news_article_tags: true,
	SEO: {
		populate: {
			author: true,
		},
	},
}

const toStringArray = (value: unknown): string[] => {
	if (Array.isArray(value)) {
		return value
			.flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
			.map((entry) => entry.trim())
			.filter(Boolean)
	}
	if (typeof value === 'string') {
		return value
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean)
	}
	return []
}

const toInt = (value: unknown, fallback: number): number => {
	if (typeof value !== 'string' && typeof value !== 'number') return fallback
	const parsed = Number.parseInt(String(value), 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const toSortArray = (value: unknown): string[] => {
	const list = toStringArray(value)
	return list.length > 0 ? list : ['publishedAt:desc']
}

const parsePagination = (
	query: NewsArticleSearchQuery,
): { page: number; pageSize: number } => ({
	page: toInt(query.page, 1),
	pageSize: Math.min(toInt(query.pageSize, 20), 100),
})

const toFilterConditions = (
	query: NewsArticleSearchQuery,
): Array<Record<string, unknown>> => {
	const conditions: Array<Record<string, unknown>> = [
		{ publishedAt: { $notNull: true } },
	]

	const categoryDocumentId = typeof query.categoryDocumentId === 'string'
		? query.categoryDocumentId.trim()
		: ''
	if (categoryDocumentId.length > 0) {
		conditions.push({
			category: {
				documentId: categoryDocumentId,
			},
		})
		return conditions
	}

	const categorySlug = typeof query.categorySlug === 'string'
		? query.categorySlug.trim()
		: ''
	if (categorySlug.length > 0) {
		conditions.push({
			category: {
				Slug: categorySlug,
			},
		})
	}

	return conditions
}

export default factories.createCoreController(
	'api::news-article.news-article',
	({ strapi }: { strapi: Core.Strapi }) => ({
		async search(ctx: any) {
			const rawQuery = (ctx?.query ?? {}) as NewsArticleSearchQuery
			const { page, pageSize } = parsePagination(rawQuery)
			const sort = toSortArray(rawQuery.sort)
			const filterConditions = toFilterConditions(rawQuery)

			const result = await findDocumentsPage(
				strapi as never,
				'api::news-article.news-article',
				{
					populate: NEWS_ARTICLE_SECTION_SEARCH_POPULATE,
					sort,
					page,
					pageSize,
					status: 'published',
					filters: { $and: filterConditions },
				},
			)

			return {
				data: result.results,
				meta: { pagination: result.pagination },
			}
		},

		async newArticlesNum(ctx) {
			const { category, timestamp } = ctx.query

			if (!category) {
				return ctx.badRequest('Category is required')
			}

			try {
				const count = await strapi
					.service('api::news-article.news-article')
					.countNewArticles(category, timestamp)

				return { count }
			} catch (error) {
				strapi.log.error(error)
				return ctx.internalServerError('An error occurred while counting articles')
			}
		},
	}),
)

import type { Core } from '@strapi/strapi'

export interface DocumentPaginationMeta {
	page: number
	pageSize: number
	pageCount: number
	total: number
}

export interface FindDocumentsPageOptions {
	filters?: Record<string, unknown>
	populate?: Record<string, unknown>
	sort?: string | string[]
	page: number
	pageSize: number
	status?: 'published' | 'draft'
}

export interface FindDocumentsPageResult<T = Record<string, unknown>> {
	results: T[]
	pagination: DocumentPaginationMeta
}

export async function findDocumentsPage<T = Record<string, unknown>>(
	strapi: Core.Strapi,
	uid: string,
	options: FindDocumentsPageOptions,
): Promise<FindDocumentsPageResult<T>> {
	const { page, pageSize, filters, populate, sort, status } = options
	const start = (page - 1) * pageSize

	const baseQuery: Record<string, unknown> = {}
	if (filters) baseQuery.filters = filters
	if (populate) baseQuery.populate = populate
	if (sort) baseQuery.sort = sort
	if (status) baseQuery.status = status

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const docService = strapi.documents(uid as any)

	const [results, total] = await Promise.all([
		docService.findMany({
			...baseQuery,
			start,
			limit: pageSize,
		}) as Promise<T[]>,
		docService.count({
			...baseQuery,
		}) as Promise<number>,
	])

	const safeTotal = typeof total === 'number' ? total : results.length
	const pageCount = Math.max(1, Math.ceil(safeTotal / pageSize))

	return {
		results: Array.isArray(results) ? results : [],
		pagination: {
			page,
			pageSize,
			pageCount,
			total: safeTotal,
		},
	}
}

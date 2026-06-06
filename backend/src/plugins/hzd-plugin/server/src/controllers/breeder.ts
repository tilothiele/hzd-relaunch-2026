/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { enrichBreederRecords } from '../utils/breeder-enrich'

const VALID_BREEDER_ROLES = ['B', 'S'] as const
type BreederRoleValue = (typeof VALID_BREEDER_ROLES)[number]

interface BreederSearchQuery {
	name?: string
	breederRole?: string
	ownerMemberDocumentId?: string
	page?: string | number
	pageSize?: string | number
	sort?: string | string[]
}

const MEMBER_CONTACT_FIELDS = [
	'documentId',
	'cId',
	'firstName',
	'lastName',
	'region',
	'phone',
	'email',
	'city',
	'address1',
	'address2',
	'zip',
	'countryCode',
	'locationLat',
	'locationLng',
	'username',
] as const

const BREEDER_SEARCH_POPULATE = {
	member: {
		fields: [...MEMBER_CONTACT_FIELDS],
	},
	avatar: true,
	Address: true,
	owner_members: {
		fields: [...MEMBER_CONTACT_FIELDS],
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
	return list.length > 0 ? list : ['kennelName:asc']
}

const parsePagination = (
	query: BreederSearchQuery,
): { page: number; pageSize: number } => ({
	page: toInt(query.page, 1),
	pageSize: toInt(query.pageSize, 10),
})

const toFilterConditions = (query: BreederSearchQuery): Array<Record<string, unknown>> => {
	const conditions: Array<Record<string, unknown>> = []

	const breederRole = typeof query.breederRole === 'string'
		? query.breederRole.trim()
		: ''
	if (
		breederRole.length > 0
		&& (VALID_BREEDER_ROLES as readonly string[]).includes(breederRole)
	) {
		conditions.push({ BreederRole: { $eq: breederRole as BreederRoleValue } })
		conditions.push({ IsActive: { $eq: true } })
		conditions.push({
			$or: [{ Disable: { $eq: false } }, { Disable: { $null: true } }],
		})
	}

	const ownerMemberDocumentId = typeof query.ownerMemberDocumentId === 'string'
		? query.ownerMemberDocumentId.trim()
		: ''
	if (ownerMemberDocumentId.length > 0) {
		conditions.push({
			owner_members: { documentId: { $eq: ownerMemberDocumentId } },
		})
	}

	const name = typeof query.name === 'string' ? query.name.trim() : ''
	if (name.length > 0) {
		conditions.push({
			$or: [
				{ kennelName: { $containsi: name } },
				{ member: { lastName: { $containsi: name } } },
				{ member: { firstName: { $containsi: name } } },
				{ member: { DisplayName: { $containsi: name } } },
				{ member: { username: { $containsi: name } } },
			],
		})
	}

	return conditions
}

const coreControllerFactory = factories.createCoreController(
	'plugin::hzd-plugin.breeder',
	({ strapi }: { strapi: Core.Strapi }) => ({
		async find(ctx: any) {
			const response = await Object.getPrototypeOf(this).find.call(this, ctx)

			if (response?.data) {
				response.data = await enrichBreederRecords(strapi, response.data)
			}

			return response
		},

		async findOne(ctx: any) {
			const response = await Object.getPrototypeOf(this).findOne.call(this, ctx)

			if (response?.data) {
				response.data = await enrichBreederRecords(strapi, response.data)
			}

			return response
		},

		async search(ctx: any) {
			const rawQuery = (ctx?.query ?? {}) as BreederSearchQuery
			const filterConditions = toFilterConditions(rawQuery)
			const { page, pageSize } = parsePagination(rawQuery)
			const sort = toSortArray(rawQuery.sort)

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const queryParams: Record<string, any> = {
				populate: BREEDER_SEARCH_POPULATE,
				sort,
				pagination: { page, pageSize },
			}

			if (filterConditions.length > 0) {
				queryParams.filters = { $and: filterConditions }
			}

			const result = await strapi.entityService.findPage(
				'plugin::hzd-plugin.breeder',
				queryParams,
			)

			let results: any[] = Array.isArray(result?.results) ? result.results : []
			results = (await enrichBreederRecords(strapi, results)) as any[]

			const pagination = result?.pagination ?? {
				page,
				pageSize,
				pageCount: 1,
				total: results.length,
			}

			return {
				data: results,
				meta: { pagination },
			}
		},
	}),
)

export default ({ strapi }: { strapi: Core.Strapi }) => coreControllerFactory({ strapi })

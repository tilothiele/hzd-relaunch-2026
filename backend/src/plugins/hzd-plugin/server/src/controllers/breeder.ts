/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../utils/document-pagination'
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
	'cEmail',
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
	avatar: true,
	Address: true,
	owner_members: {
		fields: ['id', ...MEMBER_CONTACT_FIELDS],
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
				{ Address: { FullName: { $containsi: name } } },
				{ owner_members: { lastName: { $containsi: name } } },
				{ owner_members: { firstName: { $containsi: name } } },
				{ owner_members: { DisplayName: { $containsi: name } } },
			],
		})
	}

	return conditions
}

const EDITABLE_BREEDER_TEXT_FIELDS = [
	'WebsiteUrlDraft',
	'BreedersIntroDraft',
	'BreedersMessage',
] as const

async function loadUserFromRequest(strapi: Core.Strapi, ctx: any) {
	const jwtService = strapi.plugin('users-permissions')?.service('jwt')
	if (!jwtService?.getToken) {
		return null
	}

	try {
		const payload = await jwtService.getToken(ctx)
		const userId = payload?.id
		if (userId == null) {
			return null
		}

		return strapi.db.query('plugin::users-permissions.user').findOne({
			where: { id: userId },
		})
	} catch {
		return null
	}
}

function userOwnsBreeder(
	user: { id?: number | string | null; documentId?: string | null },
	breeder: unknown,
): boolean {
	if (!breeder || typeof breeder !== 'object') {
		return false
	}

	const record = breeder as { owner_members?: unknown }
	const ids = new Set<string>()
	if (user.id != null) {
		ids.add(String(user.id))
	}
	if (user.documentId) {
		ids.add(String(user.documentId))
	}

	const members = Array.isArray(record.owner_members) ? record.owner_members : []
	return members.some((member) => {
		if (!member || typeof member !== 'object') {
			return false
		}
		const owner = member as { id?: number | string; documentId?: string }
		return ids.has(String(owner.id ?? ''))
			|| (typeof owner.documentId === 'string' && ids.has(owner.documentId))
	})
}

const decodeRouteKey = (value: unknown): string => {
	if (typeof value !== 'string') {
		return ''
	}
	try {
		return decodeURIComponent(value).trim()
	} catch {
		return value.trim()
	}
}

const coreControllerFactory = factories.createCoreController(
	'plugin::hzd-plugin.breeder',
	({ strapi }: { strapi: Core.Strapi }) => ({
		async find(ctx: any) {
			const skipEnrich = ctx?.query?.enrich === 'false'
			if (skipEnrich) {
				delete ctx.query.enrich
			}

			const response = await Object.getPrototypeOf(this).find.call(this, ctx)

			if (response?.data && !skipEnrich) {
				response.data = await enrichBreederRecords(strapi, response.data)
			}

			return response
		},

		async findOne(ctx: any) {
			const documentId = ctx.params.documentId
			const token = process.env.STRAPI_API_TOKEN ?? null

			const entity = await strapi.db
				.query('plugin::hzd-plugin.breeder')
				.findOne({
					where: { documentId },
					populate: {
						avatar: true,
						Address: true,
						owner_members: { fields: ['id', ...MEMBER_CONTACT_FIELDS] },
					},
				})

			if (!entity) {
				return ctx.notFound()
			}

			const enriched = await enrichBreederRecords(strapi, entity)

			return ctx.json({ data: enriched })
		},

		async search(ctx: any) {
			const rawQuery = (ctx?.query ?? {}) as BreederSearchQuery
			const filterConditions = toFilterConditions(rawQuery)
			const { page, pageSize } = parsePagination(rawQuery)
			const sort = toSortArray(rawQuery.sort)

			const result = await findDocumentsPage(
				strapi,
				'plugin::hzd-plugin.breeder',
				{
					populate: BREEDER_SEARCH_POPULATE,
					sort,
					page,
					pageSize,
					filters: filterConditions.length > 0
						? { $and: filterConditions }
						: undefined,
				},
			)

			let results: any[] = result.results
			results = (await enrichBreederRecords(strapi, results)) as any[]

			return {
				data: results,
				meta: { pagination: result.pagination },
			}
		},

		async findPublic(ctx: any) {
			const key = decodeRouteKey(ctx.params?.key)
			if (!key) {
				return ctx.notFound('Eintrag nicht gefunden.')
			}

			const loadByFilter = async (filters: Record<string, unknown>) => {
				const page = await findDocumentsPage(
					strapi,
					'plugin::hzd-plugin.breeder',
					{
						populate: BREEDER_SEARCH_POPULATE,
						page: 1,
						pageSize: 1,
						filters,
					},
				)
				return page.results[0] ?? null
			}

			const slugKey = key.replace(/^\/+/, '')
			const storedSlug = slugKey ? `/${slugKey}` : ''
			const breeder = (storedSlug
				? await loadByFilter({ Slug: { $eq: storedSlug } })
				: null)
				?? (slugKey && slugKey !== storedSlug
					? await loadByFilter({ Slug: { $eq: slugKey } })
					: null)
				?? await loadByFilter({ documentId: { $eq: key } })

			if (!breeder) {
				return ctx.notFound('Eintrag nicht gefunden.')
			}

			const enriched = await enrichBreederRecords(strapi, breeder)
			ctx.body = { data: enriched }
		},

		async update(ctx: any) {
			const user = await loadUserFromRequest(strapi, ctx)
			if (!user) {
				return ctx.unauthorized('Nicht authentifiziert.')
			}

			const documentId = typeof ctx.params?.id === 'string' ? ctx.params.id : ''
			const breeder = documentId
				? await strapi.documents('plugin::hzd-plugin.breeder').findOne({
					documentId,
					populate: { owner_members: true },
				})
				: null

			if (!breeder) {
				return ctx.notFound('Zwinger nicht gefunden.')
			}

			if (!userOwnsBreeder(user, breeder)) {
				return ctx.forbidden('Dieser Zwinger gehört nicht zum eigenen Konto.')
			}

			const input = ctx.request.body?.data as Record<string, unknown> | undefined
			if (!input || typeof input !== 'object' || Array.isArray(input)) {
				return ctx.badRequest('Missing "data" payload in the request body')
			}

			const data: Record<string, unknown> = {}
			for (const field of EDITABLE_BREEDER_TEXT_FIELDS) {
				if (!(field in input)) {
					continue
				}
				const value = input[field]
				data[field] = typeof value === 'string' ? value : null
			}

			if ('BreederEmail' in input) {
				const email = typeof input.BreederEmail === 'string'
					? input.BreederEmail.trim()
					: ''
				data.BreederEmail = email.length > 0 ? email : null
			}

			if ('isDirty' in input) {
				data.isDirty = input.isDirty === true
			}

			const entity = await strapi.documents('plugin::hzd-plugin.breeder').update({
				documentId,
				data,
				populate: BREEDER_SEARCH_POPULATE,
			})

			const enriched = await enrichBreederRecords(strapi, entity)
			return { data: enriched }
		},
	}),
)

export default ({ strapi }: { strapi: Core.Strapi }) => coreControllerFactory({ strapi })

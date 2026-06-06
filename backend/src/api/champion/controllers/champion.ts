/**
 * champion controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../../../plugins/hzd-plugin/server/src/utils/document-pagination'
import { enrichBreederRecords } from '../../../plugins/hzd-plugin/server/src/utils/breeder-enrich'

interface ChampionSearchQuery {
	page?: string | number
	pageSize?: string | number
	sort?: string | string[]
	year?: string | number
	dogName?: string
}

const MEMBER_CONTACT_FIELDS = [
	'documentId',
	'firstName',
	'lastName',
	'city',
	'zip',
	'countryCode',
] as const

const CHAMPION_SEARCH_POPULATE = {
	ChampinAvatar: true,
	ChampionshipTitles: true,
	hzd_plugin_dog: {
		fields: ['documentId', 'givenName', 'fullKennelName', 'cBreederId'],
		populate: {
			avatar: true,
			owner: {
				fields: [...MEMBER_CONTACT_FIELDS],
			},
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
	return list.length > 0 ? list : ['DateOfChampionship:desc']
}

const parsePagination = (
	query: ChampionSearchQuery,
): { page: number; pageSize: number } => ({
	page: toInt(query.page, 1),
	pageSize: toInt(query.pageSize, 20),
})

const toFilterConditions = (query: ChampionSearchQuery): Array<Record<string, unknown>> => {
	const conditions: Array<Record<string, unknown>> = [
		{ publishedAt: { $notNull: true } },
	]

	const year = toInt(query.year, 0)
	if (year > 0) {
		conditions.push({
			DateOfChampionship: {
				$gte: `${year}-01-01`,
				$lte: `${year}-12-31`,
			},
		})
	}

	const dogName = typeof query.dogName === 'string' ? query.dogName.trim() : ''
	if (dogName.length > 0) {
		conditions.push({
			hzd_plugin_dog: {
				$or: [
					{ givenName: { $containsi: dogName } },
					{ fullKennelName: { $containsi: dogName } },
				],
			},
		})
	}

	return conditions
}

const enrichDogWithBreeder = async (
	strapi: Core.Strapi,
	dog: Record<string, any>,
	breedersByCId: Map<number, Record<string, any>>,
): Promise<Record<string, any>> => {
	const cBreederId = typeof dog.cBreederId === 'number' ? dog.cBreederId : null
	if (cBreederId == null) {
		dog.breeder = null
		return dog
	}

	let breeder = breedersByCId.get(cBreederId)
	if (!breeder) {
		breeder = await strapi.db.query('plugin::hzd-plugin.breeder').findOne({
			where: { cId: cBreederId },
		})
		if (breeder) {
			breedersByCId.set(cBreederId, breeder)
		}
	}

	dog.breeder = breeder ?? null
	return dog
}

const enrichChampionRecords = async (
	strapi: Core.Strapi,
	champions: Array<Record<string, any>>,
): Promise<Array<Record<string, any>>> => {
	const breedersByCId = new Map<number, Record<string, any>>()
	const breedersToEnrich: Array<Record<string, any>> = []

	for (const champion of champions) {
		const dog = champion.hzd_plugin_dog
		if (!dog || typeof dog !== 'object') {
			continue
		}

		await enrichDogWithBreeder(strapi, dog, breedersByCId)
		if (dog.breeder) {
			breedersToEnrich.push(dog.breeder)
		}
	}

	if (breedersToEnrich.length > 0) {
		// Plugin- und API-Strapi-Typen unterscheiden sich (separate @strapi/types).
		await enrichBreederRecords(strapi as never, breedersToEnrich)
	}

	return champions
}

export default factories.createCoreController(
	'api::champion.champion',
	({ strapi }: { strapi: Core.Strapi }) => ({
		async search(ctx: any) {
			const rawQuery = (ctx?.query ?? {}) as ChampionSearchQuery
			const { page, pageSize } = parsePagination(rawQuery)
			const sort = toSortArray(rawQuery.sort)
			const filterConditions = toFilterConditions(rawQuery)

			const result = await findDocumentsPage(
				strapi as never,
				'api::champion.champion',
				{
					populate: CHAMPION_SEARCH_POPULATE,
					sort,
					page,
					pageSize,
					status: 'published',
					filters: { $and: filterConditions },
				},
			)

			let results: any[] = result.results
			results = await enrichChampionRecords(strapi, results)

			return {
				data: results,
				meta: { pagination: result.pagination },
			}
		},
	}),
)

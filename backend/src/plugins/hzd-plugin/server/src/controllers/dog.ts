/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyController = Record<string, any>

// Haversine-Formel für Distanzberechnung
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
	const R = 6371 // Erdradius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLon = ((lon2 - lon1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
		Math.cos((lat2 * Math.PI) / 180) *
		Math.sin(dLon / 2) *
		Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

const VALID_SEX = ['M', 'F'] as const
const VALID_COLOR = ['S', 'SM', 'B'] as const
const VALID_HD = ['A1', 'A2', 'B1', 'B2'] as const
const VALID_SOD1 = ['N_N', 'N_DM', 'DM_DM'] as const

type SexValue = (typeof VALID_SEX)[number]
type ColorValue = (typeof VALID_COLOR)[number]
type HDValue = (typeof VALID_HD)[number]
type SOD1Value = (typeof VALID_SOD1)[number]

interface DogSearchQuery {
	name?: string
	sex?: string
	color?: string
	hd?: string
	sod1?: string
	eyesCheck?: string
	heartCheck?: string
	colorCheck?: string
	ownerCIds?: string | string[]
	cBreederId?: string | number
	maxAge?: string | number
	lat?: string | number
	lng?: string | number
	maxDistance?: string | number
	page?: string | number
	pageSize?: string | number
	sort?: string | string[]
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

const toNumber = (value: unknown, fallback: number): number => {
	if (typeof value !== 'string' && typeof value !== 'number') return fallback
	const parsed = Number.parseFloat(String(value))
	return Number.isFinite(parsed) ? parsed : fallback
}

const toInt = (value: unknown, fallback: number): number => {
	if (typeof value !== 'string' && typeof value !== 'number') return fallback
	const parsed = Number.parseInt(String(value), 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const toSortArray = (value: unknown): string[] => {
	const list = toStringArray(value)
	return list.length > 0 ? list : ['fullKennelName:asc']
}

const parsePagination = (
	query: DogSearchQuery,
): { page: number; pageSize: number } => ({
	page: toInt(query.page, 1),
	pageSize: toInt(query.pageSize, 10),
})

const toTriStateBool = (value: unknown): boolean | null => {
	if (value === 'true' || value === true) return true
	if (value === 'false' || value === false) return false
	return null
}

const PEDIGREE_SELECT = [
	'id',
	'documentId',
	'fullKennelName',
	'givenName',
	'dateOfBirth',
	'dateOfDeath',
] as const

/** UI zeigt 3 Ahnen-Generationen: Eltern → Großeltern → Urgroßeltern */
const PEDIGREE_ANCESTOR_GENERATIONS = 3

const getParentDogId = async (
	strapi: Core.Strapi,
	dogId: number,
	relation: 'father' | 'mother',
): Promise<number | null> => {
	const table = relation === 'father' ? 'dogs_father_lnk' : 'dogs_mother_lnk'
	const link = await strapi.db.connection(table)
		.select('inv_dog_id')
		.where('dog_id', dogId)
		.first()

	const parentId = link?.inv_dog_id
	return typeof parentId === 'number' ? parentId : null
}

const pedigreeCacheKey = (dogId: number, generationsLeft: number): string =>
	`${dogId}:${generationsLeft}`

const loadPedigreeNode = async (
	strapi: Core.Strapi,
	dogId: number,
	generationsLeft: number,
	cache: Map<string, Record<string, any>>,
): Promise<Record<string, any> | null> => {
	const cacheKey = pedigreeCacheKey(dogId, generationsLeft)
	if (cache.has(cacheKey)) {
		return cache.get(cacheKey)!
	}

	const record = await strapi.db.query('plugin::hzd-plugin.dog').findOne({
		where: { id: dogId },
		select: [...PEDIGREE_SELECT],
	})

	if (!record) {
		return null
	}

	const node: Record<string, any> = {
		...record,
		father: null,
		mother: null,
	}

	if (generationsLeft > 0) {
		const fatherId = await getParentDogId(strapi, dogId, 'father')
		const motherId = await getParentDogId(strapi, dogId, 'mother')

		if (fatherId != null) {
			node.father = await loadPedigreeNode(
				strapi,
				fatherId,
				generationsLeft - 1,
				cache,
			)
		}

		if (motherId != null) {
			node.mother = await loadPedigreeNode(
				strapi,
				motherId,
				generationsLeft - 1,
				cache,
			)
		}
	}

	cache.set(cacheKey, node)
	return node
}

const enrichDogPedigreeTransitive = async (
	strapi: Core.Strapi,
	dog: Record<string, any>,
	cache: Map<string, Record<string, any>>,
): Promise<void> => {
	const dogId = dog.id
	if (typeof dogId !== 'number') {
		return
	}

	const fatherId = await getParentDogId(strapi, dogId, 'father')
	const motherId = await getParentDogId(strapi, dogId, 'mother')
	const generationsBelowDog = PEDIGREE_ANCESTOR_GENERATIONS - 1

	if (fatherId != null) {
		const existingOwner = dog.father?.owner
		dog.father = await loadPedigreeNode(
			strapi,
			fatherId,
			generationsBelowDog,
			cache,
		)
		if (dog.father && existingOwner) {
			dog.father.owner = existingOwner
		}
	}

	if (motherId != null) {
		const existingOwner = dog.mother?.owner
		dog.mother = await loadPedigreeNode(
			strapi,
			motherId,
			generationsBelowDog,
			cache,
		)
		if (dog.mother && existingOwner) {
			dog.mother.owner = existingOwner
		}
	}
}

const enrichDogWithBreeder = async (
	strapi: Core.Strapi,
	dog: Record<string, any>,
	breedersByCId: Map<number, any>,
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

const loadExcludedBreederCIds = async (strapi: Core.Strapi): Promise<number[]> => {
	// Schema hat aktuell kein `HasNoDogsAvailabe` — daher wird der Filter vorerst nicht angewendet.
	// Sobald das Feld ergänzt ist, hier aktivieren.
	const candidate = await strapi.db.query('plugin::hzd-plugin.breeder').findMany({
		select: ['cId'],
		// where: { HasNoDogsAvailabe: true },
		limit: 1,
	})
	if (Array.isArray(candidate) && candidate.length > 0) {
		// Schema hat das Feld (noch) nicht — keine Ausschlüsse.
	}
	return []
}

const toFilterConditions = async (
	strapi: Core.Strapi,
	query: DogSearchQuery,
): Promise<Array<Record<string, unknown>>> => {
	const conditions: Array<Record<string, unknown>> = []

	// Standard: nur fertile Hunde
	conditions.push({ cFertile: { $eq: true } })

	// Disabled: false oder null
	conditions.push({
		$or: [{ Disabled: { $eq: false } }, { Disabled: { $null: true } }],
	})

	const name = typeof query.name === 'string' ? query.name.trim() : ''
	if (name.length > 0) {
		conditions.push({
			$or: [
				{ givenName: { $containsi: name } },
				{ fullKennelName: { $containsi: name } },
			],
		})
	}

	const sex = typeof query.sex === 'string' ? query.sex.trim() : ''
	if (sex.length > 0 && (VALID_SEX as readonly string[]).includes(sex)) {
		conditions.push({ sex: { $eq: sex as SexValue } })
	}

	const color = typeof query.color === 'string' ? query.color.trim() : ''
	if (color.length > 0 && (VALID_COLOR as readonly string[]).includes(color)) {
		conditions.push({ color: { $eq: color as ColorValue } })
	}

	const hd = typeof query.hd === 'string' ? query.hd.trim() : ''
	if (hd.length > 0 && (VALID_HD as readonly string[]).includes(hd)) {
		conditions.push({ HD: { $eq: hd as HDValue } })
	}

	const sod1 = typeof query.sod1 === 'string' ? query.sod1.trim() : ''
	if (sod1.length > 0 && (VALID_SOD1 as readonly string[]).includes(sod1)) {
		conditions.push({ SOD1: { $eq: sod1 as SOD1Value } })
	}

	const eyes = toTriStateBool(query.eyesCheck)
	if (eyes !== null) conditions.push({ EyesCheck: { $eq: eyes } })
	const heart = toTriStateBool(query.heartCheck)
	if (heart !== null) conditions.push({ HeartCheck: { $eq: heart } })
	const colorCheck = toTriStateBool(query.colorCheck)
	if (colorCheck !== null) conditions.push({ ColorCheck: { $eq: colorCheck } })

	// Besitzer / Züchter
	const ownerCIds = toStringArray(query.ownerCIds)
		.map((id) => Number.parseInt(id, 10))
		.filter((id) => Number.isFinite(id))

	const cBreederIdRaw = query.cBreederId
	const cBreederId =
		typeof cBreederIdRaw === 'number'
			? cBreederIdRaw
			: typeof cBreederIdRaw === 'string' && cBreederIdRaw.trim().length > 0
				? Number.parseInt(cBreederIdRaw, 10)
				: NaN

	if (ownerCIds.length > 0) {
		conditions.push({ cOwnerId: { $in: ownerCIds } })
	} else if (Number.isFinite(cBreederId)) {
		conditions.push({ cBreederId: { $eq: cBreederId } })
	} else {
		const excludedBreederCIds = await loadExcludedBreederCIds(strapi)
		if (excludedBreederCIds.length > 0) {
			conditions.push({
				$or: [
					{ cBreederId: { $null: true } },
					{ cBreederId: { $notIn: excludedBreederCIds } },
				],
			})
		}
	}

	// maxAge: nur Hunde, deren dateOfBirth >= (heute - maxAge Jahre)
	const maxAgeRaw = query.maxAge
	if (maxAgeRaw !== undefined && maxAgeRaw !== null && maxAgeRaw !== '') {
		const maxAge =
			typeof maxAgeRaw === 'number' ? maxAgeRaw : Number.parseInt(String(maxAgeRaw), 10)
		if (Number.isFinite(maxAge) && maxAge > 0) {
			const date = new Date()
			date.setFullYear(date.getFullYear() - maxAge)
			const dateString = date.toISOString().split('T')[0]
			conditions.push({ dateOfBirth: { $gte: dateString } })
		}
	}

	return conditions
}

const coreControllerFactory = factories.createCoreController(
	'plugin::hzd-plugin.dog',
	({ strapi }: { strapi: Core.Strapi }) => {
		const service = strapi.service('plugin::hzd-plugin.dog')

		return {
			async find(ctx: any) {
				const { lat, lng } = ctx.query ?? {}
				if (lat && lng) {
					return service.find(ctx)
				}

				return Object.getPrototypeOf(this).find.call(this, ctx)
			},

			async search(ctx: any) {
				const rawQuery = (ctx?.query ?? {}) as DogSearchQuery
				const filterConditions = await toFilterConditions(strapi, rawQuery)
				const { page, pageSize } = parsePagination(rawQuery)
				const sort = toSortArray(rawQuery.sort)
				const hasGeo = rawQuery.lat != null && rawQuery.lng != null

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const queryParams: Record<string, any> = {
					populate: {
						owner: {
							fields: [
								'documentId',
								'firstName',
								'lastName',
								'city',
								'zip',
								'phone',
								'cEmail',
								'countryCode',
								'locationLat',
								'locationLng',
							],
						},
						father: {
							fields: ['documentId', 'fullKennelName', 'givenName', 'dateOfBirth', 'dateOfDeath'],
							populate: {
								owner: {
									fields: [
										'documentId',
										'firstName',
										'lastName',
										'city',
										'zip',
										'phone',
										'cEmail',
										'countryCode',
										'locationLat',
										'locationLng',
									],
								},
							},
						},
						mother: {
							fields: ['documentId', 'fullKennelName', 'givenName', 'dateOfBirth', 'dateOfDeath'],
							populate: {
								owner: {
									fields: [
										'documentId',
										'firstName',
										'lastName',
										'city',
										'zip',
										'phone',
										'cEmail',
										'countryCode',
										'locationLat',
										'locationLng',
									],
								},
							},
						},
						Images: true,
						avatar: true,
						DogDocument: {
							populate: { MediaFile: true },
						},
					},
					sort,
					pagination: hasGeo ? { pageSize: 1000 } : { page, pageSize },
				}

				if (filterConditions.length > 0) {
					queryParams.filters = { $and: filterConditions }
				}

				const result = await strapi.entityService.findPage(
					'plugin::hzd-plugin.dog',
					queryParams,
				)

				let results: any[] = Array.isArray(result?.results) ? result.results : []

				// Breeder-Anreicherung (cBreederId -> breeder record)
				const breedersByCId = new Map<number, any>()
				const pedigreeCache = new Map<string, Record<string, any>>()
				results = await Promise.all(
					results.map(async (dog) => {
						const enriched = await enrichDogWithBreeder(strapi, dog, breedersByCId)
						await enrichDogPedigreeTransitive(strapi, enriched, pedigreeCache)
						return enriched
					}),
				)

				// Distanz-Filterung im Backend (Haversine auf owner.locationLat/Lng)
				let total = results.length
				if (hasGeo) {
					const searchLat = toNumber(rawQuery.lat, NaN)
					const searchLng = toNumber(rawQuery.lng, NaN)
					const maxDist = toNumber(rawQuery.maxDistance, 100)
					if (Number.isFinite(searchLat) && Number.isFinite(searchLng)) {
						results = results
							.map((dog) => {
								const owner = dog.owner
								const lat = owner ? Number.parseFloat(String(owner.locationLat)) : NaN
								const lng = owner ? Number.parseFloat(String(owner.locationLng)) : NaN
								if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
									return { dog, distance: null }
								}
								const distance = calculateDistance(searchLat, searchLng, lat, lng)
								return { dog, distance }
							})
							.filter(({ distance }) => distance !== null && distance <= maxDist)
							.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
							.map(({ dog, distance }) => {
								if (distance != null) {
									dog.distance = Math.round(distance * 100) / 100
								}
								return dog
							})
						total = results.length
					}
				}

				// Pagination anwenden (im Geo-Fall war pageSize 1000)
				const effectivePage = hasGeo ? page : 1
				const effectivePageSize = hasGeo ? pageSize : results.length
				const startIndex = (effectivePage - 1) * effectivePageSize
				const endIndex = startIndex + effectivePageSize
				const paginatedResults = hasGeo ? results.slice(startIndex, endIndex) : results

				const finalTotal = hasGeo ? total : paginatedResults.length
				const finalPageCount = hasGeo
					? Math.max(1, Math.ceil(total / effectivePageSize))
					: 1

				const pagination = hasGeo
					? {
							page: effectivePage,
							pageSize: effectivePageSize,
							pageCount: finalPageCount,
							total: finalTotal,
						}
					: (result?.pagination ?? {
							page,
							pageSize,
							pageCount: 1,
							total: finalTotal,
						})

				return {
					data: paginatedResults,
					meta: { pagination },
				}
			},
		}
	},
)

export default ({ strapi }: { strapi: Core.Strapi }) => coreControllerFactory({ strapi })

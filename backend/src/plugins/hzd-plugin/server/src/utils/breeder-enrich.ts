import type { Core } from '@strapi/strapi'

function sanitizeUser(user: any): any {
	if (user == null) {
		return user
	}

	if (user.publishMyData === true) {
		return user
	}

	return {
		id: user.id,
		documentId: user.documentId ?? null,
		cId: user.cId ?? null,
		username: `user-${user.id}`,
		email: `user-${user.id}@hovawarte.com`,
	}
}

const USER_CONTACT_SELECT = [
	'id',
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
	'DisplayName',
	'username',
	'publishMyData',
] as const

type BreederRecord = Record<string, any>

function isBreederRecord(value: unknown): value is BreederRecord {
	return value != null && typeof value === 'object' && !Array.isArray(value)
}

function collectBreederList(data: unknown): BreederRecord[] {
	if (Array.isArray(data)) {
		return data.filter(isBreederRecord)
	}

	if (isBreederRecord(data)) {
		return [data]
	}

	return []
}

function userCacheKey(user: { id?: number; documentId?: string | null }): string | null {
	if (user.id != null) {
		return `id:${user.id}`
	}

	if (user.documentId) {
		return `doc:${user.documentId}`
	}

	return null
}

async function findUserByCId(strapi: Core.Strapi, cId: number | null | undefined) {
	if (cId == null) {
		return null
	}

	return strapi.db.query('plugin::users-permissions.user').findOne({
		where: { cId },
		select: [...USER_CONTACT_SELECT],
	})
}

async function loadOwnerMembersByBreederId(
	strapi: Core.Strapi,
	breederId: number,
): Promise<any[]> {
	const users = await strapi.db.query('plugin::users-permissions.user').findMany({
		where: {
			breeders: {
				id: breederId,
			},
		},
		select: [...USER_CONTACT_SELECT],
	})

	return users
		.map((user) => sanitizeUser(user))
		.filter((user): user is Record<string, any> => user != null)
}

async function loadUsersForBreeders(
	strapi: Core.Strapi,
	breeders: BreederRecord[],
): Promise<Map<string, any>> {
	const usersByKey = new Map<string, any>()

	for (const breeder of breeders) {
		if (typeof breeder.id !== 'number') {
			continue
		}

		const ownerMembers = await loadOwnerMembersByBreederId(strapi, breeder.id)
		for (const ownerMember of ownerMembers) {
			const key = userCacheKey(ownerMember)
			if (key) {
				usersByKey.set(key, ownerMember)
			}
		}

		if (isBreederRecord(breeder.member)) {
			const key = userCacheKey(breeder.member)
			if (key && !usersByKey.has(key)) {
				usersByKey.set(key, breeder.member)
			}
		}
	}

	for (const breeder of breeders) {
		if (typeof breeder.cId !== 'number') {
			continue
		}

		const user = await findUserByCId(strapi, breeder.cId)
		if (!user) {
			continue
		}

		const key = userCacheKey(user)
		if (key && !usersByKey.has(key)) {
			usersByKey.set(key, user)
		}
	}

	return usersByKey
}

function resolveMemberUser(
	breeder: BreederRecord,
	usersByKey: Map<string, any>,
): any | null {
	if (isBreederRecord(breeder.member)) {
		const key = userCacheKey(breeder.member)
		if (key && usersByKey.has(key)) {
			return sanitizeUser(usersByKey.get(key))
		}

		return sanitizeUser(breeder.member)
	}

	if (typeof breeder.cId === 'number') {
		for (const user of usersByKey.values()) {
			if (user.cId === breeder.cId) {
				return sanitizeUser(user)
			}
		}
	}

	return null
}

async function resolveOwnerMembers(
	strapi: Core.Strapi,
	breeder: BreederRecord,
): Promise<any[]> {
	if (typeof breeder.id === 'number') {
		const ownerMembers = await loadOwnerMembersByBreederId(strapi, breeder.id)
		if (ownerMembers.length > 0) {
			return ownerMembers
		}
	}

	return []
}

async function resolveDogs(
	strapi: Core.Strapi,
	breeder: BreederRecord,
): Promise<any[]> {
	if (typeof breeder.id !== 'number' || !breeder.member?.id) {
		return []
	}

	const dogs = await strapi.db.query('plugin::hzd-plugin.dog').findMany({
		where: {
			owner: {
				member: {
					id: breeder.member.id,
				},
			},
			sex: 'M',
		},
		select: ['documentId', 'avatar', 'sex'],
		populate: {
			avatar: true,
			owner: {
				fields: ['documentId', 'cId'],
			},
		},
	})

	return dogs ?? []
}

export async function enrichBreederRecords(
	strapi: Core.Strapi,
	data: unknown,
): Promise<unknown> {
	const breeders = collectBreederList(data)

	if (breeders.length === 0) {
		return data
	}

	const usersByKey = await loadUsersForBreeders(strapi, breeders)

	for (const breeder of breeders) {
		breeder.member = resolveMemberUser(breeder, usersByKey)
		breeder.owner_members = await resolveOwnerMembers(strapi, breeder)
		breeder.dogs = await resolveDogs(strapi, breeder)
	}

	return data
}

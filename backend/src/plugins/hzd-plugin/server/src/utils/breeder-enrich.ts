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
		strapi.log.debug('[resolveDogs] early return: breeder.id=' + breeder.id + ', member.id=' + breeder.member?.id)
		return []
	}

	strapi.log.debug('[resolveDogs] querying dogs for breeder.id=' + breeder.id + ', member.id=' + breeder.member.id + ', cId=' + breeder.member.cId)

	// Probiere beide IDs: erst cId, dann member.id
	const cOwnerId = breeder.member.cId ?? breeder.member.id

	const dogs = await strapi.db.query('plugin::hzd-plugin.dog').findMany({
		where: {
			sex: 'M',
			cOwnerId: cOwnerId,
		},
		select: ['documentId', 'sex'],
		populate: {
			avatar: true,
			owner: {
				select: ['id', 'documentId'],
			},
		},
	})

	strapi.log.debug('[resolveDogs] found dogs:', JSON.stringify(dogs))

	return dogs ?? []
}

export async function enrichBreederRecords(
	strapi: Core.Strapi,
	data: unknown,
): Promise<unknown> {
	const breeders = collectBreederList(data)
	strapi.log.debug('[enrichBreederRecords] found breeders:', breeders.length)

	if (breeders.length === 0) {
		return data
	}

	const usersByKey = await loadUsersForBreeders(strapi, breeders)

	for (const breeder of breeders) {
		strapi.log.debug('[enrichBreederRecords] processing breeder id:', breeder.id, 'typeof:', typeof breeder.id)
		strapi.log.debug('[enrichBreederRecords] breeder keys:', Object.keys(breeder))
		breeder.member = resolveMemberUser(breeder, usersByKey)
		breeder.owner_members = await resolveOwnerMembers(strapi, breeder)
		breeder.dogs = await resolveDogs(strapi, breeder)
		strapi.log.debug('[enrichBreederRecords] breeder.dogs:', JSON.stringify(breeder.dogs))
	}

	return data
}

import type { AuthUser } from '@/types/auth-user'

const TIK_GROUP_KEY = 'tik'
const SONDERLEITER_GROUP_KEY = 'sonderleiter'

function readGroupKey(group: unknown): string {
	if (!group || typeof group !== 'object') {
		return ''
	}

	//console.log('group', group)
	const record = group as Record<string, unknown>
	const attributes = record.attributes
	const nested = attributes
		&& typeof attributes === 'object'
		&& !Array.isArray(attributes)
		? attributes as Record<string, unknown>
		: null
	const key = typeof record.key === 'string'
		? record.key
		: typeof nested?.key === 'string'
			? nested.key
			: ''

	return key.trim().toLowerCase()
}

function listGroups(user: AuthUser | null | undefined): unknown[] {
	const value = user?.user_groups as unknown

	if (Array.isArray(value)) {
		return value
	}

	if (value && typeof value === 'object') {
		const data = (value as Record<string, unknown>).data
		if (Array.isArray(data)) {
			return data
		}
	}

	return []
}

export function belongsToGroup(
	user: AuthUser | null | undefined,
	groupKey: string,
): boolean {

	//console.log('belongsToGroup', { user, groupKey })
	const expected = groupKey.trim().toLowerCase()
	if (!expected) {
		return false
	}

	return listGroups(user).some((group) => readGroupKey(group) === expected)
}

export function isTik(user: AuthUser | null | undefined): boolean {
	return belongsToGroup(user, TIK_GROUP_KEY)
}

export function isSonderleiter(user: AuthUser | null | undefined): boolean {
	return belongsToGroup(user, SONDERLEITER_GROUP_KEY)
}

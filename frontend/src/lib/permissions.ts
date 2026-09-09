import type { AuthUser, UserGroup } from '@/types'

const SONDERLEITER_GROUP_ID = 1
const KOERMEISTER_GROUP_ID = 2

function getUserGroupNames(user: AuthUser | null): string[] {
	if (!user?.user_groups?.length) {
		return []
	}

	return user.user_groups
		.map((group) => group.Name?.trim())
		.filter((name): name is string => Boolean(name))
}

function getUserGroupKeys(group: UserGroup | null | undefined): string[] {
	if (!group) {
		return []
	}

	const keys: string[] = []

	if (typeof group.documentId === 'string' && group.documentId.length > 0) {
		keys.push(`documentId:${group.documentId}`)
	}

	if (group.id !== null && group.id !== undefined && String(group.id).length > 0) {
		keys.push(`id:${String(group.id)}`)
	}

	return keys
}

function belongsToGroupId(user: AuthUser | null, groupId: number): boolean {
	if (!user?.user_groups?.length) {
		return false
	}

	return user.user_groups.some(
		(group) => String(group.id) === String(groupId),
	)
}

export function isBreeder(user: AuthUser | null): boolean {
	return user?.cFlagBreeder === true
}

export function isKoermeister(user: AuthUser | null): boolean {
	return belongsToGroupId(user, KOERMEISTER_GROUP_ID)
}

export function isSonderleiter(user: AuthUser | null): boolean {
	return belongsToGroupId(user, SONDERLEITER_GROUP_ID)
}

export function hasUserGroup(user: AuthUser | null, groupName: string): boolean {
	const expected = groupName.trim().toLowerCase()
	if (!expected) {
		return false
	}

	return getUserGroupNames(user).some(
		(name) => name.toLowerCase() === expected,
	)
}

export function hasAnyUserGroup(
	user: AuthUser | null,
	groupNames: string[],
): boolean {
	return groupNames.some((groupName) => hasUserGroup(user, groupName))
}

export function hasRequiredUserGroups(
	user: AuthUser | null,
	requiredGroups: UserGroup[] | null | undefined,
): boolean {
	if (!requiredGroups?.length) {
		return true
	}

	if (!user?.user_groups?.length) {
		return false
	}

	const userKeys = new Set(
		user.user_groups.flatMap((group) => getUserGroupKeys(group)),
	)

	if (userKeys.size === 0) {
		return false
	}

	return requiredGroups.some((group) =>
		getUserGroupKeys(group).some((key) => userKeys.has(key)),
	)
}

const permissions = {
	isBreeder,
	isKoermeister,
	isSonderleiter,
	hasUserGroup,
	hasAnyUserGroup,
	hasRequiredUserGroups,
}

export default permissions

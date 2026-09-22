import type { AuthUser, ComponentPermissionRestriction, UserGroup } from '@/types'

const SONDERLEITER_GROUP_ID = 1
const KOERMEISTER_GROUP_ID = 2
const DECKRUEDENBESITZER_GROUP_ID = 3
const ZUECHTER_GROUP_ID = 4

type RestrictionLike = {
	user_groups?: unknown
}

function unwrapCollection(value: unknown): unknown[] {
	if (value == null) {
		return []
	}

	if (Array.isArray(value)) {
		return value
	}

	if (typeof value !== 'object') {
		if (typeof value === 'number' || typeof value === 'string') {
			return [value]
		}

		return []
	}

	const record = value as Record<string, unknown>

	if (Array.isArray(record.data)) {
		return record.data
	}

	if (Array.isArray(record.results)) {
		return record.results
	}

	if (Array.isArray(record.nodes)) {
		return record.nodes
	}

	if (record.data && typeof record.data === 'object') {
		return [record.data]
	}

	if (
		'id' in record
		|| 'documentId' in record
		|| 'Name' in record
		|| 'name' in record
		|| 'attributes' in record
	) {
		return [record]
	}

	return []
}

function flattenGroup(group: unknown): Record<string, unknown> | null {
	if (group == null) {
		return null
	}

	if (typeof group === 'number' || typeof group === 'string') {
		const value = String(group).trim()
		if (!value) {
			return null
		}

		return {
			id: group,
			documentId: value,
		}
	}

	if (typeof group !== 'object') {
		return null
	}

	const record = group as Record<string, unknown>
	const attributes = record.attributes
		&& typeof record.attributes === 'object'
		&& !Array.isArray(record.attributes)
		? record.attributes as Record<string, unknown>
		: {}

	return {
		...attributes,
		...record,
	}
}

function normalizeUserGroups(value: unknown): UserGroup[] {
	return unwrapCollection(value)
		.map(flattenGroup)
		.filter((item): item is Record<string, unknown> => item !== null)
		.map((item) => {
			const name = typeof item.Name === 'string'
				? item.Name
				: typeof item.name === 'string'
					? item.name
					: null

			return {
				id: (item.id as number | string | null | undefined) ?? null,
				documentId: typeof item.documentId === 'string'
					? item.documentId
					: null,
				Name: name,
			}
		})
}

function extractRequiredGroups(required: unknown): UserGroup[] {
	if (
		required
		&& typeof required === 'object'
		&& !Array.isArray(required)
		&& 'user_groups' in (required as RestrictionLike)
	) {
		return normalizeUserGroups((required as RestrictionLike).user_groups)
	}

	return normalizeUserGroups(required)
}

function getUserGroupKeys(group: UserGroup | null | undefined): string[] {
	if (!group) {
		return []
	}

	const keys: string[] = []

	if (typeof group.documentId === 'string' && group.documentId.length > 0) {
		keys.push(`documentId:${group.documentId}`)
	}

	if (
		group.id !== null
		&& group.id !== undefined
		&& String(group.id).length > 0
	) {
		keys.push(`id:${String(group.id)}`)
	}

	const name = group.Name?.trim().toLowerCase()
	if (name) {
		keys.push(`name:${name}`)
	}

	return keys
}

function getUserGroups(user: AuthUser | null): UserGroup[] {
	return normalizeUserGroups(user?.user_groups)
}

function getUserGroupNames(user: AuthUser | null): string[] {
	return getUserGroups(user)
		.map((group) => group.Name?.trim())
		.filter((name): name is string => Boolean(name))
}

function belongsToGroupId(user: AuthUser | null, groupId: number): boolean {
	return getUserGroups(user).some(
		(group) => String(group.id) === String(groupId),
	)
}

export function isBreeder(user: AuthUser | null): boolean {
	return user?.cFlagBreeder === true
}

export function isZuechter(user: AuthUser | null): boolean {
	return belongsToGroupId(user, ZUECHTER_GROUP_ID)
}

export function isKoermeister(user: AuthUser | null): boolean {
	return belongsToGroupId(user, KOERMEISTER_GROUP_ID)
}

export function isDeckruedenbesitzer(user: AuthUser | null): boolean {
	return belongsToGroupId(user, DECKRUEDENBESITZER_GROUP_ID)
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

/**
 * True, wenn `Page.Restriction.user_groups` leer ist.
 * Sonst muss der User mindestens eine der hinterlegten Gruppen haben.
 */
export function hasUserGroupRestriction(
	restriction?: ComponentPermissionRestriction | RestrictionLike | null,
): boolean {
	return extractRequiredGroups(restriction).length > 0
}

/**
 * Prüft, ob der User eine der geforderten Gruppen besitzt.
 * Ist die Collection leer oder nicht gesetzt, gilt die Prüfung als erfüllt.
 */
export function hasRequiredGroups(
	user: AuthUser | null,
	requiredGroups?: UserGroup[] | ComponentPermissionRestriction | null,
): boolean {
	const groups = extractRequiredGroups(requiredGroups)
	if (!groups.length) {
		return true
	}

	const userGroups = getUserGroups(user)
	if (!userGroups.length) {
		return false
	}

	const userKeys = new Set(
		userGroups.flatMap((group) => getUserGroupKeys(group)),
	)

	if (userKeys.size === 0) {
		return false
	}

	return groups.some((group) =>
		getUserGroupKeys(group).some((key) => userKeys.has(key)),
	)
}

export const hasRequiredUserGroups = hasRequiredGroups

const permissions = {
	isBreeder,
	isKoermeister,
	isSonderleiter,
	hasUserGroup,
	hasAnyUserGroup,
	hasRequiredGroups,
	hasRequiredUserGroups,
	hasUserGroupRestriction,
}

export default permissions

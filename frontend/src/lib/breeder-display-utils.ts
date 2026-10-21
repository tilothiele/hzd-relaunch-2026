import { readPosition } from '@/lib/geo-utils'
import type { Address, AuthUser, Breeder, Image } from '@/types'

/**
 * Pfadsegment für /breeder/… .
 * Der Slug ist im Backend bereits mit führendem „/“ gespeichert.
 */
export function breederDetailKey(
	slug: string | null | undefined,
	documentId: string,
): string {
	const segment = slug?.trim().replace(/^\/+/, '') ?? ''
	return segment || documentId
}

/** Öffentlicher Pfad: gesetzter Slug, sonst documentId. */
export function breederDetailPath(breeder: {
	documentId: string
	Slug?: string | null
}): string {
	return `/breeder/${encodeURIComponent(breederDetailKey(breeder.Slug, breeder.documentId))}`
}

type ContactUser = Pick<
	AuthUser,
	| 'id'
	| 'documentId'
	| 'cId'
	| 'firstName'
	| 'lastName'
	| 'region'
	| 'phone'
	| 'cEmail'
	| 'city'
	| 'address1'
	| 'address2'
	| 'zip'
	| 'countryCode'
>

export interface BreederContactInfo {
	/** Address.FullName, sonst kommaseparierte owner_members */
	ownerDisplayName: string
	names: string[]
	ownerDocumentIds: string[]
	ownerCIds: number[]
	zip: string | null
	city: string | null
	countryCode: string | null
	phone: string | null
	email: string | null
	region: string | null
	address1: string | null
	address2: string | null
	locationLat: number | null
	locationLng: number | null
}

function isContactUser(value: unknown): value is ContactUser {
	return value != null && typeof value === 'object'
}

function resolveOwnerMemberDisplayName(user: ContactUser): string | null {
	const parts = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean)
	return parts.length > 0 ? parts.join(' ') : null
}

function pickFirstString(...values: Array<string | null | undefined>): string | null {
	for (const value of values) {
		if (typeof value === 'string' && value.trim().length > 0) {
			return value.trim()
		}
	}

	return null
}

function resolveAddress(breeder: Breeder): Address | null {
	return breeder.Address ?? null
}

function resolveOwnerMembers(breeder: Breeder): ContactUser[] {
	return (breeder.owner_members ?? []).filter(isContactUser)
}

function resolvePrimaryUser(breeder: Breeder): ContactUser | null {
	return resolveOwnerMembers(breeder)[0] ?? null
}

export function resolveOwnerMemberDisplayNames(breeder: Breeder): string[] {
	return resolveOwnerMembers(breeder)
		.map(resolveOwnerMemberDisplayName)
		.filter((name): name is string => Boolean(name))
}

function resolveBreederPersonDisplayName(breeder: Breeder): {
	displayName: string
	names: string[]
} {
	const fullName = breeder.Address?.FullName?.trim()
	if (fullName) {
		return {
			displayName: fullName,
			names: [fullName],
		}
	}

	const ownerMemberNames = resolveOwnerMemberDisplayNames(breeder)
	return {
		displayName: ownerMemberNames.join(', '),
		names: ownerMemberNames,
	}
}

export function resolveOwnerMemberDocumentIds(breeder: Breeder): string[] {
	return resolveOwnerMembers(breeder)
		.map((user) => user.documentId)
		.filter((documentId): documentId is string => Boolean(documentId))
}

export function resolveOwnerMemberCIds(breeder: Breeder): number[] {
	return resolveOwnerMembers(breeder)
		.map((user) => user.cId)
		.filter((cId): cId is number => typeof cId === 'number')
}

export function resolveBreederContact(breeder: Breeder): BreederContactInfo {
	const address = resolveAddress(breeder)
	const ownerMembers = resolveOwnerMembers(breeder)
	const primaryUser = resolvePrimaryUser(breeder)
	const { displayName, names } = resolveBreederPersonDisplayName(breeder)
	const position = readPosition(address?.locationLat, address?.locationLng)

	return {
		ownerDisplayName: displayName,
		names,
		ownerDocumentIds: resolveOwnerMemberDocumentIds(breeder),
		ownerCIds: resolveOwnerMemberCIds(breeder),
		zip: pickFirstString(
			...ownerMembers.map((user) => user.zip),
			primaryUser?.zip,
			address?.Zip,
		),
		city: pickFirstString(
			...ownerMembers.map((user) => user.city),
			primaryUser?.city,
			address?.City,
		),
		countryCode: pickFirstString(
			...ownerMembers.map((user) => user.countryCode),
			primaryUser?.countryCode,
			address?.CountryCode,
		),
		phone: pickFirstString(
			...ownerMembers.map((user) => user.phone),
			primaryUser?.phone,
		),
		email: pickFirstString(
			...ownerMembers.map((user) => user.cEmail),
			primaryUser?.cEmail,
			breeder.BreederEmail,
		),
		region: pickFirstString(
			...ownerMembers.map((user) => user.region),
			primaryUser?.region,
		),
		address1: pickFirstString(
			...ownerMembers.map((user) => user.address1),
			primaryUser?.address1,
			address?.Address1,
		),
		address2: pickFirstString(
			...ownerMembers.map((user) => user.address2),
			primaryUser?.address2,
			address?.Address2,
		),
		locationLat: position?.lat ?? null,
		locationLng: position?.lng ?? null,
	}
}

export function findMaleOwnerDogAvatar(breeder: Breeder): Image | null {
	const ownerIds = new Set<string>()
	for (const user of resolveOwnerMembers(breeder)) {
		if (user.id != null) {
			ownerIds.add(String(user.id))
		}
		if (user.documentId) {
			ownerIds.add(user.documentId)
		}
	}

	const dogs = breeder.dogs
	if (!Array.isArray(dogs) || ownerIds.size === 0) {
		return null
	}

	const match = dogs.find((dog) => {
		if (!dog.avatar || dog.sex !== 'M' || !dog.owner) {
			return false
		}
		const ownerId = dog.owner.id != null ? String(dog.owner.id) : ''
		return ownerIds.has(ownerId) || ownerIds.has(dog.owner.documentId)
	})

	return match?.avatar ?? null
}

export function formatBreederLocation(contact: BreederContactInfo): string | null {
	const location = [contact.zip, contact.city].filter(Boolean).join(' ').trim()

	if (!location) {
		return null
	}

	if (contact.countryCode && contact.countryCode !== 'DE' && contact.countryCode !== 'D') {
		return `${location} (${contact.countryCode})`
	}

	return location
}

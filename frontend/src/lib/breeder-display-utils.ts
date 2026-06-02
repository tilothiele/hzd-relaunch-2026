import type { Address, Breeder } from '@/types'

type BreederMember = NonNullable<Breeder['member']>

type ContactUser = BreederMember & {
	cId?: number | null
}

export interface BreederContactInfo {
	/** Kommaseparierte Vor- und Nachnamen aller owner_members */
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
	const ownerMembers = resolveOwnerMembers(breeder)
	if (ownerMembers.length > 0) {
		return ownerMembers[0]
	}

	if (isContactUser(breeder.member)) {
		return breeder.member
	}

	return null
}

export function resolveOwnerMemberDisplayNames(breeder: Breeder): string[] {
	return resolveOwnerMembers(breeder)
		.map(resolveOwnerMemberDisplayName)
		.filter((name): name is string => Boolean(name))
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
	const member = isContactUser(breeder.member) ? breeder.member : null
	const primaryUser = resolvePrimaryUser(breeder)
	const names = resolveOwnerMemberDisplayNames(breeder)

	return {
		ownerDisplayName: names.join(', '),
		names,
		ownerDocumentIds: resolveOwnerMemberDocumentIds(breeder),
		ownerCIds: resolveOwnerMemberCIds(breeder),
		zip: pickFirstString(
			...ownerMembers.map((user) => user.zip),
			member?.zip,
			primaryUser?.zip,
			address?.Zip,
		),
		city: pickFirstString(
			...ownerMembers.map((user) => user.city),
			member?.city,
			primaryUser?.city,
			address?.City,
		),
		countryCode: pickFirstString(
			...ownerMembers.map((user) => user.countryCode),
			member?.countryCode,
			primaryUser?.countryCode,
			address?.CountryCode,
		),
		phone: pickFirstString(
			...ownerMembers.map((user) => user.phone),
			member?.phone,
			primaryUser?.phone,
		),
		email: pickFirstString(
			...ownerMembers.map((user) => user.email),
			member?.email,
			primaryUser?.email,
			breeder.BreederEmail,
		),
		region: pickFirstString(
			...ownerMembers.map((user) => user.region),
			member?.region,
			primaryUser?.region,
		),
		address1: pickFirstString(
			...ownerMembers.map((user) => user.address1),
			member?.address1,
			primaryUser?.address1,
			address?.Address1,
		),
		address2: pickFirstString(
			...ownerMembers.map((user) => user.address2),
			member?.address2,
			primaryUser?.address2,
			address?.Address2,
		),
		locationLat: typeof primaryUser?.locationLat === 'number'
			? primaryUser.locationLat
			: typeof member?.locationLat === 'number'
				? member.locationLat
				: null,
		locationLng: typeof primaryUser?.locationLng === 'number'
			? primaryUser.locationLng
			: typeof member?.locationLng === 'number'
				? member.locationLng
				: null,
	}
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

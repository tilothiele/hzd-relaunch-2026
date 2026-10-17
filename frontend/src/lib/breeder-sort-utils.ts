import { resolveBreederContact } from '@/lib/breeder-display-utils'
import type { Breeder } from '@/types'

export type BreederSortDirection = 'asc' | 'desc'

export type BreederSortField =
	| 'kennelName'
	| 'fullName'
	| 'zip'
	| 'city'
	| 'phone'
	| 'cEmail'

const API_SORT_FIELDS = new Set<BreederSortField>(['kennelName'])

export function getBreederApiSort(
	sortField: BreederSortField,
	direction: BreederSortDirection,
): string {
	if (API_SORT_FIELDS.has(sortField)) {
		return `${sortField}:${direction}`
	}

	return `kennelName:${direction}`
}

function getBreederSortValue(
	breeder: Breeder,
	sortField: BreederSortField,
): string {
	const contact = resolveBreederContact(breeder)
	switch (sortField) {
		case 'kennelName':
			return breeder.kennelName ?? ''
		case 'fullName':
			return breeder.Address?.FullName ?? contact.ownerDisplayName
		case 'zip':
			return contact.zip ?? ''
		case 'city':
			return contact.city ?? ''
		case 'phone':
			return contact.phone ?? ''
		case 'cEmail':
			return contact.email ?? ''
		default:
			return ''
	}
}

export function sortBreedersByField(
	breeders: Breeder[],
	sortField: BreederSortField,
	direction: BreederSortDirection,
): Breeder[] {
	if (API_SORT_FIELDS.has(sortField)) {
		return breeders
	}

	return [...breeders].sort((a, b) => {
		const cmp = getBreederSortValue(a, sortField).localeCompare(
			getBreederSortValue(b, sortField),
			'de',
		)
		return direction === 'asc' ? cmp : -cmp
	})
}

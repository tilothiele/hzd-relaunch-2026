import type { Breeder } from '@/types'

export type BreederSortDirection = 'asc' | 'desc'

export type BreederSortField =
	| 'kennelName'
	| 'member.lastName'
	| 'member.zip'
	| 'member.city'
	| 'member.phone'
	| 'member.email'

/** Strapi REST: keine Sortierung über Relation-Pfade (member.lastName → 400) */
export function getBreederApiSort(
	sortField: BreederSortField,
	direction: BreederSortDirection,
): string {
	if (!sortField.includes('.')) {
		return `${sortField}:${direction}`
	}

	return `kennelName:${direction}`
}

function getBreederSortValue(
	breeder: Breeder,
	sortField: BreederSortField,
): string {
	switch (sortField) {
		case 'kennelName':
			return breeder.kennelName ?? ''
		case 'member.lastName':
			return breeder.member?.lastName ?? ''
		case 'member.zip':
			return breeder.member?.zip ?? ''
		case 'member.city':
			return breeder.member?.city ?? ''
		case 'member.phone':
			return breeder.member?.phone ?? ''
		case 'member.email':
			return breeder.member?.email ?? ''
		default:
			return ''
	}
}

export function sortBreedersByField(
	breeders: Breeder[],
	sortField: BreederSortField,
	direction: BreederSortDirection,
): Breeder[] {
	if (!sortField.includes('.')) {
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

import type { Breeder } from '@/services/db'
import { formatPlzOrt } from '@/lib/map-strapi-breeder'

export const BREEDER_SEARCH_MAX_RESULTS = 100

export function isEligibleZuechter(breeder: Breeder): boolean {
	return breeder.role === 'B' && breeder.isActive && !breeder.disabled
}

export function searchBreeders(
	breeders: Breeder[],
	query: string,
	limit = BREEDER_SEARCH_MAX_RESULTS,
	predicate?: (breeder: Breeder) => boolean,
): Breeder[] {
	const trimmed = query.trim()
	if (!trimmed || !breeders.length) {
		return []
	}

	const normalizedQuery = trimmed.toLowerCase()
	const pool = predicate
		? breeders.filter((breeder) => predicate(breeder))
		: breeders

	return pool
		.filter((breeder) => {
			const haystack = [
				breeder.name,
				breeder.kennelName,
				breeder.street,
				breeder.zip,
				breeder.city,
				formatPlzOrt(breeder.zip, breeder.city),
				breeder.phone,
				breeder.email,
			].join(' ').toLowerCase()

			return haystack.includes(normalizedQuery)
		})
		.slice(0, limit)
}

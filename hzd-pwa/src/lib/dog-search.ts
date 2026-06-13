import type { Dog } from '@/services/db'

export const DOG_SEARCH_MAX_RESULTS = 100

export function searchDogs(
	dogs: Dog[],
	query: string,
	limit = DOG_SEARCH_MAX_RESULTS,
): Dog[] {
	const trimmed = query.trim()
	if (!trimmed || !dogs.length) {
		return []
	}

	const normalizedQuery = trimmed.toLowerCase()

	return dogs
		.filter((dog) => {
			const name = (dog.fullkennelname || '').toLowerCase()
			const chip = (dog.microchipNo || '').toLowerCase()
			const studBook = (dog.cStudBookNumber || '').toLowerCase()

			return (
				name.includes(normalizedQuery)
				|| chip.includes(normalizedQuery)
				|| studBook.includes(normalizedQuery)
			)
		})
		.slice(0, limit)
}

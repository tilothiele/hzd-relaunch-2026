import type { Dog } from '@/services/db'

export const DOG_SEARCH_MAX_RESULTS = 100
export const ZUCHTHUENDIN_MAX_AGE_YEARS = 10

function isFemale(sex: string): boolean {
	const value = sex.trim().toUpperCase()
	return value === 'F' || value === 'H'
}

function isFertile(value: string): boolean {
	const fertile = value.trim().toLowerCase()
	return fertile === 'j'
		|| fertile === 'ja'
		|| fertile === 'yes'
		|| fertile === 'true'
		|| fertile === '1'
}

function parseBirthDate(value: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
	if (match) {
		const date = new Date(
			Number(match[1]),
			Number(match[2]) - 1,
			Number(match[3]),
		)
		return Number.isNaN(date.getTime()) ? null : date
	}

	const date = new Date(value)
	return Number.isNaN(date.getTime()) ? null : date
}

function isYoungerThanYears(birth: Date, years: number, now: Date): boolean {
	const cutoff = new Date(
		now.getFullYear() - years,
		now.getMonth(),
		now.getDate(),
	)
	const birthDay = new Date(
		birth.getFullYear(),
		birth.getMonth(),
		birth.getDate(),
	)
	return birthDay > cutoff
}

export function isEligibleZuchthuendin(
	dog: Dog,
	now: Date = new Date(),
): boolean {
	if (!isFemale(dog.sex) || !isFertile(dog.cFertile)) {
		return false
	}

	const birth = parseBirthDate(dog.dateofbirth)
	if (!birth) {
		return false
	}

	return isYoungerThanYears(birth, ZUCHTHUENDIN_MAX_AGE_YEARS, now)
}

export function searchDogs(
	dogs: Dog[],
	query: string,
	limit = DOG_SEARCH_MAX_RESULTS,
	predicate?: (dog: Dog) => boolean,
): Dog[] {
	const trimmed = query.trim()
	if (!trimmed || !dogs.length) {
		return []
	}

	const normalizedQuery = trimmed.toLowerCase()
	const pool = predicate ? dogs.filter(predicate) : dogs

	return pool
		.filter((dog) => {
			const name = (dog.fullkennelname || '').toLowerCase()
			const givenName = (dog.givenName || '').toLowerCase()
			const chip = (dog.microchipNo || '').toLowerCase()
			const studBook = (dog.cStudBookNumber || '').toLowerCase()

			return (
				name.includes(normalizedQuery)
				|| givenName.includes(normalizedQuery)
				|| chip.includes(normalizedQuery)
				|| studBook.includes(normalizedQuery)
			)
		})
		.slice(0, limit)
}

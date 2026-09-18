/** Max. gleichzeitige PassedDog-Einträge pro E-Mail mit Approved ≠ true */
export const MAX_PENDING_PASSED_DOGS = 3

function ymd(d: Date): string {
	return d.toISOString().slice(0, 10)
}

/** Sterbedatum: höchstens heute, nicht älter als ein Jahr */
export function passedDogDateBounds(): { min: string; max: string } {
	const today = new Date()
	const max = ymd(today)
	const minD = new Date(today)
	minD.setFullYear(minD.getFullYear() - 1)
	return { min: ymd(minD), max }
}

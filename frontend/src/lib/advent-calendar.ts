const BERLIN = 'Europe/Berlin'

export interface AdventMoment {
	year: number
	month: number
	day: number
}

export function readAdventMoment(date: Date): AdventMoment {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: BERLIN,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date)

	const read = (type: Intl.DateTimeFormatPartTypes) => Number(
		parts.find((part) => part.type === type)?.value,
	)

	return {
		year: read('year'),
		month: read('month'),
		day: read('day'),
	}
}

/** TestDate ersetzt das aktuelle Datum, sonst gilt die Berliner Ortszeit. */
export function resolveAdventMoment(
	testDate: string | null | undefined,
	now: Date = new Date(),
): AdventMoment {
	const trimmed = testDate?.trim()
	if (trimmed) {
		const parsed = new Date(trimmed)
		if (!Number.isNaN(parsed.getTime())) {
			return readAdventMoment(parsed)
		}
	}

	return readAdventMoment(now)
}

export function isAdventCalendarVisible(moment: AdventMoment): boolean {
	return moment.month === 12 && moment.day >= 1 && moment.day <= 31
}

export function isDoorOpenable(moment: AdventMoment, doorDay: number): boolean {
	return isAdventCalendarVisible(moment) && moment.day >= doorDay
}

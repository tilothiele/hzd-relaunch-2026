const BERLIN = 'Europe/Berlin'

export interface AdventMoment {
	year: number
	month: number
	day: number
}

export interface AdventCalendarTiming {
	Jahr?: number | null
	TageVorlauf?: number | null
	TageNachlauf?: number | null
}

interface AdventTiming {
	year: number
	tageVorlauf: number
	tageNachlauf: number
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

function readCount(
	value: number | null | undefined,
	fallback: number,
): number {
	if (value == null || !Number.isFinite(Number(value))) {
		return fallback
	}
	return Number(value)
}

function timingOf(
	calendar: AdventCalendarTiming | null | undefined,
): AdventTiming | null {
	const jahr = calendar?.Jahr
	if (jahr == null || !Number.isFinite(Number(jahr))) {
		return null
	}

	return {
		year: Number(jahr),
		tageVorlauf: readCount(calendar?.TageVorlauf, 10),
		tageNachlauf: readCount(calendar?.TageNachlauf, 14),
	}
}

function compareMoments(left: AdventMoment, right: AdventMoment): number {
	if (left.year !== right.year) {
		return left.year - right.year
	}
	if (left.month !== right.month) {
		return left.month - right.month
	}
	return left.day - right.day
}

function addDays(moment: AdventMoment, days: number): AdventMoment {
	const date = new Date(Date.UTC(moment.year, moment.month - 1, moment.day))
	date.setUTCDate(date.getUTCDate() + days)
	return {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth() + 1,
		day: date.getUTCDate(),
	}
}

function daysUntil(from: AdventMoment, to: AdventMoment): number {
	const start = Date.UTC(from.year, from.month - 1, from.day)
	const end = Date.UTC(to.year, to.month - 1, to.day)
	return Math.round((end - start) / 86_400_000)
}

/**
 * Sichtbar nur zum Kalenderjahr.
 * Nach dem 1.11. und vor dem 1.12., wenn bis zum 1.12. weniger als
 * TageVorlauf Tage bleiben. Ab dem 1.12. bis einschließlich
 * TageNachlauf Tage nach dem 24.12.
 */
export function isAdventSectionHidden(
	moment: AdventMoment,
	calendar: AdventCalendarTiming | null | undefined,
): boolean {
	const timing = timingOf(calendar)
	if (!timing) {
		return true
	}

	const dec1: AdventMoment = { year: timing.year, month: 12, day: 1 }
	const dec24: AdventMoment = { year: timing.year, month: 12, day: 24 }
	const end = addDays(dec24, timing.tageNachlauf)
	if (compareMoments(moment, end) > 0) {
		return true
	}
	if (compareMoments(moment, dec1) >= 0) {
		return false
	}

	const nov1: AdventMoment = { year: timing.year, month: 11, day: 1 }
	if (compareMoments(moment, nov1) <= 0) {
		return true
	}

	return daysUntil(moment, dec1) >= timing.tageVorlauf
}

/** Vor dem 1.12. nur Überschrift, Ankündigung und Platzhalter. */
export function isAdventAnnouncementVisible(
	moment: AdventMoment,
	calendar: AdventCalendarTiming | null | undefined,
): boolean {
	const timing = timingOf(calendar)
	if (!timing || isAdventSectionHidden(moment, calendar)) {
		return false
	}

	const dec1: AdventMoment = { year: timing.year, month: 12, day: 1 }
	return compareMoments(moment, dec1) < 0
}

/** Ab dem 25.12. Schlussbild und Schlussgrüße. */
export function isAdventClosingVisible(
	moment: AdventMoment,
	calendar: AdventCalendarTiming | null | undefined,
): boolean {
	const timing = timingOf(calendar)
	if (!timing || isAdventSectionHidden(moment, calendar)) {
		return false
	}

	const dec25: AdventMoment = { year: timing.year, month: 12, day: 25 }
	return compareMoments(moment, dec25) >= 0
}

export function isDoorOpenable(
	moment: AdventMoment,
	doorDay: number,
	calendar: AdventCalendarTiming | null | undefined,
): boolean {
	const timing = timingOf(calendar)
	if (!timing || isAdventAnnouncementVisible(moment, calendar)) {
		return false
	}
	if (isAdventSectionHidden(moment, calendar)) {
		return false
	}

	const doorDate: AdventMoment = {
		year: timing.year,
		month: 12,
		day: doorDay,
	}
	return compareMoments(moment, doorDate) >= 0
}

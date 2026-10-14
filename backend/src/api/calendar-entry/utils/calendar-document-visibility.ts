/**
 * Ein CalendarDocument ist sichtbar, wenn VisibleFrom leer oder nicht
 * in der Zukunft liegt und VisibleTo leer oder nicht in der Vergangenheit liegt.
 */

function readTimestamp(value: unknown): number | null {
	if (value == null) {
		return null
	}

	if (value instanceof Date) {
		const time = value.getTime()
		return Number.isNaN(time) ? Number.NaN : time
	}

	if (typeof value !== 'string') {
		return Number.NaN
	}

	if (value.trim() === '') {
		return null
	}

	const time = new Date(value).getTime()
	return Number.isNaN(time) ? Number.NaN : time
}

export function isCalendarDocumentVisible(
	document: unknown,
	now = Date.now(),
): boolean {
	if (!document || typeof document !== 'object') {
		return false
	}

	const record = document as {
		VisibleFrom?: unknown
		VisibleTo?: unknown
	}
	const visibleFrom = readTimestamp(record.VisibleFrom)
	const visibleTo = readTimestamp(record.VisibleTo)
	const fromOk = visibleFrom === null || visibleFrom <= now
	const toOk = visibleTo === null || visibleTo >= now
	return fromOk && toOk
}

function filterEntry(entry: unknown, now: number): unknown {
	if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
		return entry
	}

	const record = entry as Record<string, unknown>
	if (!Array.isArray(record.CalendarDocument)) {
		return entry
	}

	return {
		...record,
		CalendarDocument: record.CalendarDocument.filter((document) => (
			isCalendarDocumentVisible(document, now)
		)),
	}
}

export function filterCalendarDocumentsInPayload(
	payload: unknown,
	now = Date.now(),
): unknown {
	if (!payload || typeof payload !== 'object') {
		return payload
	}

	const body = payload as { data?: unknown }
	if (Array.isArray(body.data)) {
		return {
			...body,
			data: body.data.map((entry) => filterEntry(entry, now)),
		}
	}

	if (body.data && typeof body.data === 'object') {
		return {
			...body,
			data: filterEntry(body.data, now),
		}
	}

	return payload
}

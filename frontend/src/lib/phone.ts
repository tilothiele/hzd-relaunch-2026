const DEFAULT_CALLING_CODE = '49'

const CALLING_CODES: Record<string, string> = {
	DE: '49',
	D: '49',
	DEU: '49',
	AT: '43',
	A: '43',
	AUT: '43',
	CH: '41',
	CHE: '41',
	LI: '423',
	NL: '31',
	NLD: '31',
	BE: '32',
	BEL: '32',
	LU: '352',
	LUX: '352',
	FR: '33',
	FRA: '33',
	PL: '48',
	POL: '48',
	CZ: '420',
	CZE: '420',
	DK: '45',
	DNK: '45',
	IT: '39',
	ITA: '39',
}

const PHONE_SPLIT = /(\s*(?:,|;|\n+|\s\/\s|\soder\s|\sund\s)\s*)/i
const LEADING_LABEL = /^(?:tel(?:efon)?|mobil(?:e)?|handy|phone|fax)\.?\s*:?\s*/i

export function hasPhoneLabel(phone: string): boolean {
	return LEADING_LABEL.test(phone.trim())
}

export interface PhoneSegment {
	text: string
	separator: string
	label: string
	number: string
}

export function splitPhoneSegments(phone: string): PhoneSegment[] {
	const trimmed = phone.trim()
	if (!trimmed) {
		return []
	}

	const pieces = trimmed.split(PHONE_SPLIT)
	const segments: PhoneSegment[] = []

	for (let index = 0; index < pieces.length; index += 2) {
		const text = pieces[index]?.trim() ?? ''
		if (!text) {
			continue
		}

		const labelMatch = text.match(LEADING_LABEL)
		const label = labelMatch?.[0] ?? ''
		const number = label ? text.slice(label.length).trim() : text

		segments.push({
			text,
			separator: index > 0 ? (pieces[index - 1] ?? '') : '',
			label,
			number: number || text,
		})
	}

	return segments
}

/** `tel:+49…` für Deutschland, vorhandene `+`/`00`-Nummern bleiben erhalten. */
export function toInternationalTel(
	phone: string,
	countryCode?: string | null,
): string | null {
	const e164 = toE164(phone, countryCode)
	return e164 ? `tel:${e164}` : null
}

export function toE164(
	phone: string,
	countryCode?: string | null,
): string | null {
	const callingCode = resolveCallingCode(countryCode)
	let value = phone.trim().replace(LEADING_LABEL, '')
	value = value.replace(/\(\s*0\s*\)/g, '')
	value = value.replace(/[^\d+]/g, '')

	if (!value) {
		return null
	}

	if (value.startsWith('00')) {
		value = `+${value.slice(2)}`
	} else if (value.startsWith('+')) {
		value = `+${value.slice(1).replace(/\+/g, '')}`
	} else if (value.startsWith('0')) {
		value = `+${callingCode}${value.slice(1)}`
	} else if (
		value.startsWith(callingCode)
		&& value.length >= callingCode.length + 6
	) {
		value = `+${value}`
	} else {
		value = `+${callingCode}${value}`
	}

	const digits = value.slice(1)
	if (!/^\d{8,15}$/.test(digits)) {
		return null
	}

	return `+${digits}`
}

function resolveCallingCode(countryCode?: string | null): string {
	if (!countryCode) {
		return DEFAULT_CALLING_CODE
	}

	const key = countryCode.trim().toUpperCase()
	return CALLING_CODES[key] ?? DEFAULT_CALLING_CODE
}

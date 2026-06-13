export const KOERUNG_GESCHLECHT_OPTIONS = ['R', 'H'] as const
export const KOERUNG_FARBE_OPTIONS = ['S', 'SM', 'B'] as const

export type KoerungGeschlecht = '' | (typeof KOERUNG_GESCHLECHT_OPTIONS)[number]
export type KoerungFarbe = '' | (typeof KOERUNG_FARBE_OPTIONS)[number]

export interface KoerungHund {
	id: string
	startnummer: number
	vollerZwingername: string
	zuchtbuchnummer: string
	geschlecht: KoerungGeschlecht
	wurftag: string
	farbe: KoerungFarbe
	besitzer: string
}

export interface KoerungVeranstaltung {
	id: string
	createdAt: string
	updatedAt: string
	datum: string
	name: string
	ort: string
	sonderleiterName: string
	hunde: KoerungHund[]
}

export function renumberKoerungHunde(hunde: KoerungHund[]): KoerungHund[] {
	return hunde.map((hund, index) => ({
		...hund,
		startnummer: index + 1,
	}))
}

export function createKoerungHund(): KoerungHund {
	return {
		id: crypto.randomUUID(),
		startnummer: 0,
		vollerZwingername: '',
		zuchtbuchnummer: '',
		geschlecht: '',
		wurftag: '',
		farbe: '',
		besitzer: '',
	}
}

export function createEmptyKoerungVeranstaltung(id: string): KoerungVeranstaltung {
	const now = new Date().toISOString()
	return {
		id,
		createdAt: now,
		updatedAt: now,
		datum: '',
		name: '',
		ort: '',
		sonderleiterName: '',
		hunde: [],
	}
}

export function normalizeKoerungVeranstaltung(
	veranstaltung: KoerungVeranstaltung,
): KoerungVeranstaltung {
	return {
		...veranstaltung,
		hunde: renumberKoerungHunde(
			(veranstaltung.hunde ?? []).map((hund) => ({
				id: hund.id ?? crypto.randomUUID(),
				startnummer: hund.startnummer ?? 0,
				vollerZwingername: hund.vollerZwingername ?? '',
				zuchtbuchnummer: hund.zuchtbuchnummer ?? '',
				geschlecht: hund.geschlecht ?? '',
				wurftag: hund.wurftag ?? '',
				farbe: hund.farbe ?? '',
				besitzer: hund.besitzer ?? '',
			})),
		),
	}
}

export function formatKoerungDatum(datum: string): string {
	if (!datum) return '–'
	const date = new Date(datum)
	if (Number.isNaN(date.getTime())) return datum
	return date.toLocaleDateString('de-DE')
}

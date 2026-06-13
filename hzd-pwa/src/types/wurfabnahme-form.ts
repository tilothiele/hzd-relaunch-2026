export const DEFAULT_WELPEN_ROWS = 5
export const MIN_WELPEN_ROWS = 1
export const MAX_WELPEN_ROWS = 15

export const WURF_NR_OPTIONS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
export const WELPEN_FARBE_OPTIONS = ['S', 'SM', 'B'] as const
export const WELPEN_GESCHLECHT_OPTIONS = ['R', 'H'] as const

export type WelpenGeschlecht = '' | 'R' | 'H'
export type WelpenFarbe = '' | 'S' | 'SM' | 'B'

export interface WelpenRowData {
	id: string
	zuchtbuchNr: string
	geschlecht: WelpenGeschlecht
	name: string
	farbe: WelpenFarbe
	chipNr: string
	gechiptAm: string
	verstorbenAm: string
}

export interface StammblattData {
	zuechterName: string
	datum: string
	zwingername: string
	wurfNr: string
	strasse: string
	plzOrt: string
	telefon: string
	email: string
	wurfGefallenAm: string
	welpen: WelpenRowData[]
	gesamteindruck: string
	pflegezustand: string
	zustandHundin: string
	ortStamm: string
	datumStamm: string
}

export interface WurfabnahmeFormData {
	stammblatt: StammblattData
	fields: Record<string, string | boolean>
	signatures: Record<string, string>
}

export interface WurfabnahmeRecord {
	id: string
	createdAt: string
	updatedAt: string
	zwingername: string
	datum: string
	welpenCount: number
	formData: WurfabnahmeFormData
}

interface LegacyWelpenRow {
	id?: string
	zuchtbuchNr?: string
	r?: boolean
	h?: boolean
	geschlecht?: WelpenGeschlecht
	name?: string
	farbe?: string
	chipNr?: string
	gechiptAm?: string
	verstorbenAm?: string
}

export function normalizeWelpenRow(row: LegacyWelpenRow): WelpenRowData {
	let geschlecht: WelpenGeschlecht = row.geschlecht ?? ''
	if (!geschlecht && row.r) geschlecht = 'R'
	if (!geschlecht && row.h) geschlecht = 'H'

	const farbe = (row.farbe ?? '') as WelpenFarbe

	return {
		id: row.id ?? crypto.randomUUID(),
		zuchtbuchNr: row.zuchtbuchNr ?? '',
		geschlecht,
		name: row.name ?? '',
		farbe,
		chipNr: row.chipNr ?? '',
		gechiptAm: row.gechiptAm ?? '',
		verstorbenAm: row.verstorbenAm ?? '',
	}
}

export function normalizeFormData(data: WurfabnahmeFormData): WurfabnahmeFormData {
	return {
		...data,
		signatures: data.signatures ?? {},
		stammblatt: {
			...data.stammblatt,
			welpen: data.stammblatt.welpen.map(normalizeWelpenRow),
		},
	}
}

export function createWelpenRow(): WelpenRowData {
	return {
		id: crypto.randomUUID(),
		zuchtbuchNr: '',
		geschlecht: '',
		name: '',
		farbe: '',
		chipNr: '',
		gechiptAm: '',
		verstorbenAm: '',
	}
}

export function createInitialWelpenRows(): WelpenRowData[] {
	return Array.from({ length: DEFAULT_WELPEN_ROWS }, createWelpenRow)
}

export function createEmptyStammblatt(): StammblattData {
	return {
		zuechterName: '',
		datum: '',
		zwingername: '',
		wurfNr: '',
		strasse: '',
		plzOrt: '',
		telefon: '',
		email: '',
		wurfGefallenAm: '',
		welpen: createInitialWelpenRows(),
		gesamteindruck: '',
		pflegezustand: '',
		zustandHundin: '',
		ortStamm: '',
		datumStamm: '',
	}
}

export function createEmptyFormData(): WurfabnahmeFormData {
	return {
		stammblatt: createEmptyStammblatt(),
		fields: {},
		signatures: {},
	}
}

export function getWurfabnahmeListLabel(record: WurfabnahmeRecord): string {
	const zwinger = record.zwingername.trim() || 'Ohne Zwingername'
	const datum = record.datum.trim()
	return datum ? `${zwinger} · ${formatDateDe(datum)}` : zwinger
}

function formatDateDe(isoDate: string): string {
	if (!isoDate) return ''
	const date = new Date(isoDate)
	if (Number.isNaN(date.getTime())) return isoDate
	return date.toLocaleDateString('de-DE')
}

export function buildRecordFromForm(
	id: string,
	formData: WurfabnahmeFormData,
	existing?: Pick<WurfabnahmeRecord, 'createdAt'>,
): WurfabnahmeRecord {
	const now = new Date().toISOString()

	return {
		id,
		createdAt: existing?.createdAt ?? now,
		updatedAt: now,
		zwingername: formData.stammblatt.zwingername,
		datum: formData.stammblatt.datum || formData.stammblatt.wurfGefallenAm,
		welpenCount: formData.stammblatt.welpen.length,
		formData,
	}
}

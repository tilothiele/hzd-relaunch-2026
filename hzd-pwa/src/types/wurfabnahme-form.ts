export const DEFAULT_WELPEN_ROWS = 5
export const MIN_WELPEN_ROWS = 1
export const MAX_WELPEN_ROWS = 15

export interface WelpenRowData {
	id: string
	zuchtbuchNr: string
	r: boolean
	h: boolean
	name: string
	farbe: string
	chipNr: string
	gechiptAm: string
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

export function createWelpenRow(): WelpenRowData {
	return {
		id: crypto.randomUUID(),
		zuchtbuchNr: '',
		r: false,
		h: false,
		name: '',
		farbe: '',
		chipNr: '',
		gechiptAm: '',
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

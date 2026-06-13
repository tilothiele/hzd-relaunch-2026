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
	zuchthuendin: string
	zuchtbuchNrHuendin: string
	welpen: WelpenRowData[]
	gesamteindruck: string
	pflegezustand: string
	zustandHundin: string
	zuchtwartName: string
	zuechterUnterschriftName: string
	zuchtanwaerterName: string
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

/** Lokale Wurfabnahme mit Versionshistorie (IndexedDB) */
export interface Wurfabnahme {
	id: string
	createdAt: string
	updatedAt: string
	zwingername: string
	datum: string
	welpenCount: number
	records: WurfabnahmeRecord[]
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
			zuchthuendin: data.stammblatt.zuchthuendin ?? '',
			zuchtbuchNrHuendin: data.stammblatt.zuchtbuchNrHuendin ?? '',
			zuchtwartName: data.stammblatt.zuchtwartName ?? '',
			zuechterUnterschriftName: data.stammblatt.zuechterUnterschriftName ?? '',
			zuchtanwaerterName: data.stammblatt.zuchtanwaerterName ?? '',
			welpen: data.stammblatt.welpen.map(normalizeWelpenRow),
		},
	}
}

/** Klont den letzten Stand für eine neue Bearbeitungsrunde; Unterschriften werden geleert. */
export function cloneFormDataForEdit(
	formData: WurfabnahmeFormData,
): WurfabnahmeFormData {
	const normalized = normalizeFormData(formData)
	return {
		stammblatt: {
			...normalized.stammblatt,
			welpen: normalized.stammblatt.welpen.map((row) => ({ ...row })),
		},
		fields: { ...normalized.fields },
		signatures: {},
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
		zuchthuendin: '',
		zuchtbuchNrHuendin: '',
		welpen: createInitialWelpenRows(),
		gesamteindruck: '',
		pflegezustand: '',
		zustandHundin: '',
		zuchtwartName: '',
		zuechterUnterschriftName: '',
		zuchtanwaerterName: '',
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

export function getWurfabnahmeListLabel(wurfabnahme: Wurfabnahme): string {
	const zwinger = wurfabnahme.zwingername.trim() || 'Ohne Zwingername'
	const datum = wurfabnahme.datum.trim()
	const wurfNr = wurfabnahme.wurfNr.trim()
	return datum ? `${zwinger} - ${wurfNr}-Wurf · ${formatDateDe(datum)}` : zwinger
}

export function getLatestWurfabnahmeRecord(
	wurfabnahme: Wurfabnahme,
): WurfabnahmeRecord {
	const { records } = wurfabnahme
	if (records.length === 0) {
		throw new Error('Wurfabnahme ohne Einträge')
	}
	return records[records.length - 1]
}

export function getWurfabnahmeHistoryRecords(
	wurfabnahme: Wurfabnahme,
): WurfabnahmeRecord[] {
	return [...wurfabnahme.records].reverse()
}

export function getWurfabnahmeRecordLabel(
	record: WurfabnahmeRecord,
	options: { isLatest?: boolean } = {},
): string {
	const zwinger = record.zwingername.trim() || 'Ohne Zwingername'
	const savedAt = formatDateTimeDe(record.createdAt)
	if (options.isLatest) {
		return `Aktuell · ${zwinger} · ${savedAt}`
	}
	const datum = record.datum.trim()
	const datumPart = datum ? `${formatDateDe(datum)} · ` : ''
	return `${datumPart}${savedAt} · ${zwinger}`
}

export function createWurfabnahme(
	id: string,
	firstRecord: WurfabnahmeRecord,
): Wurfabnahme {
	return {
		id,
		createdAt: firstRecord.createdAt,
		updatedAt: firstRecord.updatedAt,
		zwingername: firstRecord.zwingername,
		datum: firstRecord.datum,
		welpenCount: firstRecord.welpenCount,
		records: [firstRecord],
	}
}

export function appendWurfabnahmeRecord(
	wurfabnahme: Wurfabnahme,
	record: WurfabnahmeRecord,
): Wurfabnahme {
	return {
		...wurfabnahme,
		updatedAt: record.updatedAt,
		zwingername: record.zwingername,
		datum: record.datum,
		welpenCount: record.welpenCount,
		records: [...wurfabnahme.records, record],
	}
}

function formatDateDe(isoDate: string): string {
	if (!isoDate) return ''
	const date = new Date(isoDate)
	if (Number.isNaN(date.getTime())) return isoDate
	return date.toLocaleDateString('de-DE')
}

export function formatDateTimeDe(iso: string): string {
	if (!iso) return ''
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return iso
	return date.toLocaleString('de-DE')
}

export function buildRecordFromForm(
	id: string,
	formData: WurfabnahmeFormData,
): WurfabnahmeRecord {
	const now = new Date().toISOString()

	return {
		id,
		createdAt: now,
		updatedAt: now,
		zwingername: formData.stammblatt.zwingername,
		datum: formData.stammblatt.datum || formData.stammblatt.wurfGefallenAm,
		welpenCount: formData.stammblatt.welpen.length,
		formData,
	}
}

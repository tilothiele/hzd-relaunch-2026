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
	deletedAt?: string
	// Grunddaten
	wurftag: string
	gewichtGeburt: string
	rh: WelpenGeschlecht
	entwurmt: string
	entwurmtAm: string
	wurmkuren: string
	wurfbesichtigung: string
	// Feststellungen
	gewichtWa: string
	geimpft: string
	impfungenIo: boolean
	// Exterieur
	koerperbau: string
	kopfform: string
	stopp: string
	ohren: string
	ohrenBes: string
	augen: string
	augenBes: string
	gebiss: string
	canini: string
	caniniBes: string
	rute: string
	rutePos: string
	nabel: string
	nabelBes: string
	hoden: string
	// Farbbeschreibung
	swDeckhaar: string
	markenfarbe: string
	markenzeichnung: string
	blDeckhaar: string
	aufhellungen: string
	sw2Deckhaar: string
	weiss: string[]
	pigment: string
	// Verhalten
	verhalten: string[]
	// Bemerkungen
	bemerkungen: string
	deckgenehmigung: string
	aufzucht: string
	hundin: string
	// Unterschriften
	ort: string
	datum: string
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

export function normalizeWelpenRow(row: Partial<WelpenRowData>): WelpenRowData {
	let geschlecht: WelpenGeschlecht = row.geschlecht ?? ''
	if (!geschlecht && (row as any).r) geschlecht = 'R'
	if (!geschlecht && (row as any).h) geschlecht = 'H'

	return {
		id: row.id ?? crypto.randomUUID(),
		zuchtbuchNr: row.zuchtbuchNr ?? '',
		geschlecht,
		name: row.name ?? '',
		farbe: (row.farbe ?? '') as WelpenFarbe,
		chipNr: row.chipNr ?? '',
		gechiptAm: row.gechiptAm ?? '',
		verstorbenAm: row.verstorbenAm ?? '',
		deletedAt: row.deletedAt,
		wurftag: row.wurftag ?? '',
		gewichtGeburt: row.gewichtGeburt ?? '',
		rh: row.rh ?? geschlecht,
		entwurmt: row.entwurmt ?? '',
		entwurmtAm: row.entwurmtAm ?? '',
		wurmkuren: row.wurmkuren ?? '',
		wurfbesichtigung: row.wurfbesichtigung ?? '',
		gewichtWa: row.gewichtWa ?? '',
		geimpft: row.geimpft ?? '',
		impfungenIo: row.impfungenIo ?? false,
		koerperbau: row.koerperbau ?? '',
		kopfform: row.kopfform ?? '',
		stopp: row.stopp ?? '',
		ohren: row.ohren ?? '',
		ohrenBes: row.ohrenBes ?? '',
		augen: row.augen ?? '',
		augenBes: row.augenBes ?? '',
		gebiss: row.gebiss ?? '',
		canini: row.canini ?? '',
		caniniBes: row.caniniBes ?? '',
		rute: row.rute ?? '',
		rutePos: row.rutePos ?? '',
		nabel: row.nabel ?? '',
		nabelBes: row.nabelBes ?? '',
		hoden: row.hoden ?? '',
		swDeckhaar: row.swDeckhaar ?? '',
		markenfarbe: row.markenfarbe ?? '',
		markenzeichnung: row.markenzeichnung ?? '',
		blDeckhaar: row.blDeckhaar ?? '',
		aufhellungen: row.aufhellungen ?? '',
		sw2Deckhaar: row.sw2Deckhaar ?? '',
		weiss: row.weiss ?? [],
		pigment: row.pigment ?? '',
		verhalten: row.verhalten ?? [],
		bemerkungen: row.bemerkungen ?? '',
		deckgenehmigung: row.deckgenehmigung ?? '',
		aufzucht: row.aufzucht ?? '',
		hundin: row.hundin ?? '',
		ort: row.ort ?? '',
		datum: row.datum ?? '',
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

export function cloneFormDataForEdit(
	formData: WurfabnahmeFormData,
): WurfabnahmeFormData {
	const normalized = normalizeFormData(formData)
	return {
		stammblatt: {
			...normalized.stammblatt,
			welpen: normalized.stammblatt.welpen.map((row) => ({ ...row })),
		},
		signatures: {},
	}
}

/** Klont den letzten Stand für eine neue Bearbeitungsrunde; Unterschriften werden geleert. */

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
		wurftag: '',
		gewichtGeburt: '',
		rh: '',
		entwurmt: '',
		entwurmtAm: '',
		wurmkuren: '',
		wurfbesichtigung: '',
		gewichtWa: '',
		geimpft: '',
		impfungenIo: false,
		koerperbau: '',
		kopfform: '',
		stopp: '',
		ohren: '',
		ohrenBes: '',
		augen: '',
		augenBes: '',
		gebiss: '',
		canini: '',
		caniniBes: '',
		rute: '',
		rutePos: '',
		nabel: '',
		nabelBes: '',
		hoden: '',
		swDeckhaar: '',
		markenfarbe: '',
		markenzeichnung: '',
		blDeckhaar: '',
		aufhellungen: '',
		sw2Deckhaar: '',
		weiss: [],
		pigment: '',
		verhalten: [],
		bemerkungen: '',
		deckgenehmigung: '',
		aufzucht: '',
		hundin: '',
		ort: '',
		datum: '',
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
		signatures: {},
	}
}

export function getWurfabnahmeListLabel(wurfabnahme: Wurfabnahme): string {
	const zwinger = wurfabnahme.zwingername.trim() || 'Ohne Zwingername'
	const datum = wurfabnahme.datum.trim()
	const l = wurfabnahme.records.length;
	const wurfNr = l > 0 ? `${wurfabnahme.records[l-1].formData.stammblatt.wurfNr}-Wurf ` : '';
	return datum ? `${zwinger} - ${wurfNr} · ${formatDateDe(datum)}` : zwinger
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
	const activeWelpen = formData.stammblatt.welpen.filter(
		(w) => !w.deletedAt,
	)

	return {
		id,
		createdAt: now,
		updatedAt: now,
		zwingername: formData.stammblatt.zwingername,
		datum: formData.stammblatt.datum || formData.stammblatt.wurfGefallenAm,
		welpenCount: activeWelpen.length,
		formData: {
			...formData,
			stammblatt: {
				...formData.stammblatt,
				welpen: activeWelpen,
			},
		},
	}
}

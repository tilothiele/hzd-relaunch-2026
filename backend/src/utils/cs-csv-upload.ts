import { randomBytes } from 'crypto'
import { readFile } from 'fs/promises'
import type { Core } from '@strapi/strapi'
import type { CsCsvColumn } from './cs-member-columns'

const HZD_SETTING_UID = 'api::hzd-setting.hzd-setting' as const
const INSERT_PARAMETER_BUDGET = 50000

export class CsCsvUploadError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'CsCsvUploadError'
	}
}

interface UploadedFile {
	filepath?: string
	path?: string
	originalFilename?: string
	name?: string
}

export interface CsCsvUploadResult {
	generation: number
	imported: number
	skipped: number
}

function normalizeHeader(value: string): string {
	return value.trim().replace(/\s+/g, ' ')
}

function createDocumentId(): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
	const bytes = randomBytes(24)
	let id = ''
	for (let index = 0; index < 24; index += 1) {
		id += alphabet[bytes[index] % alphabet.length]
	}
	return id
}

export function parseCsv(content: string): string[][] {
	const source = content.replace(/^\uFEFF/, '')
	const rows: string[][] = []
	let row: string[] = []
	let cell = ''
	let quoted = false

	for (let index = 0; index < source.length; index += 1) {
		const char = source[index]
		if (quoted) {
			if (char === '"') {
				if (source[index + 1] === '"') {
					cell += '"'
					index += 1
				} else {
					quoted = false
				}
			} else {
				cell += char
			}
			continue
		}

		if (char === '"') {
			quoted = true
			continue
		}
		if (char === ',') {
			row.push(cell)
			cell = ''
			continue
		}
		if (char === '\n') {
			row.push(cell)
			rows.push(row)
			row = []
			cell = ''
			continue
		}
		if (char === '\r') {
			continue
		}
		cell += char
	}

	if (quoted) {
		throw new CsCsvUploadError('Die CSV-Datei enthält ein nicht geschlossenes Anführungszeichen.')
	}

	if (cell.length > 0 || row.length > 0) {
		row.push(cell)
		rows.push(row)
	}

	return rows.filter((entry) => entry.some((value) => value.trim() !== ''))
}

function mapRows(
	table: string[][],
	columns: CsCsvColumn[],
	identityAttribute: string,
): { records: Record<string, string | null>[]; skipped: number; unknownHeaders: string[] } {
	if (table.length === 0) {
		throw new CsCsvUploadError('Die CSV-Datei ist leer.')
	}

	const headerByAttribute = new Map(columns.map((column) => [column.header, column.attribute]))
	const headerRow = table[0]
	const indexByAttribute = new Map<string, number>()
	const unknownHeaders: string[] = []

	headerRow.forEach((cell, index) => {
		const header = normalizeHeader(cell)
		if (!header) {
			return
		}
		const attribute = headerByAttribute.get(header)
		if (!attribute) {
			unknownHeaders.push(header)
			return
		}
		indexByAttribute.set(attribute, index)
	})

	if (!indexByAttribute.has(identityAttribute)) {
		throw new CsCsvUploadError('Die CSV-Datei enthält nicht die erwarteten Spalten.')
	}

	const records: Record<string, string | null>[] = []
	let skipped = 0

	for (let rowIndex = 1; rowIndex < table.length; rowIndex += 1) {
		const row = table[rowIndex]
		if (row.length > headerRow.length) {
			skipped += 1
			continue
		}

		const identityIndex = indexByAttribute.get(identityAttribute) as number
		const identity = (row[identityIndex] ?? '').trim()
		if (!identity || identity === '-') {
			skipped += 1
			continue
		}

		const record: Record<string, string | null> = {}
		for (const [attribute, index] of indexByAttribute) {
			const value = (row[index] ?? '').trim()
			record[attribute] = value === '' ? null : value
		}
		records.push(record)
	}

	return { records, skipped, unknownHeaders }
}

function firstUploadedFile(value: unknown): UploadedFile | null {
	if (!value || typeof value !== 'object') {
		return null
	}
	if (Array.isArray(value)) {
		for (const entry of value) {
			const file = firstUploadedFile(entry)
			if (file) {
				return file
			}
		}
		return null
	}

	const record = value as UploadedFile
	if (typeof record.filepath === 'string' || typeof record.path === 'string') {
		return record
	}
	return null
}

function collectUploadedFiles(value: unknown, acc: UploadedFile[]): void {
	if (!value || typeof value !== 'object') {
		return
	}
	if (Array.isArray(value)) {
		value.forEach((entry) => collectUploadedFiles(entry, acc))
		return
	}

	const file = firstUploadedFile(value)
	if (file) {
		acc.push(file)
		return
	}

	for (const entry of Object.values(value as Record<string, unknown>)) {
		collectUploadedFiles(entry, acc)
	}
}

export function readUploadedCsv(files: unknown, fieldName: string): UploadedFile {
	if (files && typeof files === 'object' && !Array.isArray(files)) {
		const record = files as Record<string, unknown>
		const direct = firstUploadedFile(record[fieldName])
		if (direct) {
			return direct
		}
		const [name, extension] = fieldName.split('.')
		if (name && extension) {
			const nested = record[name]
			if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
				const nestedFile = firstUploadedFile(
					(nested as Record<string, unknown>)[extension],
				)
				if (nestedFile) {
					return nestedFile
				}
			}
		}
	}

	const collected: UploadedFile[] = []
	collectUploadedFiles(files, collected)
	const wanted = fieldName.toLowerCase()
	const named = collected.find((file) => {
		const filename = (file.originalFilename || file.name || '').toLowerCase()
		return filename === wanted
	})
	if (named) {
		return named
	}
	if (collected.length === 1) {
		return collected[0]
	}

	throw new CsCsvUploadError(`Die Datei ${fieldName} fehlt.`)
}

function readStoredGeneration(value: unknown): number | null {
	if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
		return value
	}
	if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
		return Number.parseInt(value.trim(), 10)
	}
	return null
}

async function readCurrentGeneration(
	strapi: Core.Strapi,
	field: 'ImportGenerationCSMembers' | 'ImportGenerationCSDogs',
): Promise<number> {
	const read = async (status: 'published' | 'draft') => {
		return strapi.documents(HZD_SETTING_UID).findFirst({
			status,
			fields: [field],
		})
	}

	const published = await read('published')
	const publishedGeneration = readStoredGeneration(published?.[field])
	if (publishedGeneration !== null) {
		return publishedGeneration
	}

	const draft = await read('draft')
	return readStoredGeneration(draft?.[field]) ?? 0
}

async function storeImportResult(
	strapi: Core.Strapi,
	field: 'ImportGenerationCSMembers' | 'ImportGenerationCSDogs',
	generation: number,
	importedAt: string,
): Promise<void> {
	const timestampField = field === 'ImportGenerationCSMembers'
		? 'ImportTimestampCSMembers'
		: 'ImportTimestampCSDogs'
	const published = await strapi.documents(HZD_SETTING_UID).findFirst({
		status: 'published',
	})
	const draft = await strapi.documents(HZD_SETTING_UID).findFirst({
		status: 'draft',
	})
	const documentId = published?.documentId ?? draft?.documentId
	if (!documentId) {
		throw new CsCsvUploadError('HZD Settings sind nicht angelegt.')
	}

	await strapi.documents(HZD_SETTING_UID).update({
		documentId,
		data: {
			[field]: generation,
			[timestampField]: importedAt,
		},
	})
	if (published) {
		await strapi.documents(HZD_SETTING_UID).publish({ documentId })
	}
	strapi.log.info(
		`CSV-Import: ${timestampField}=${importedAt}, ${field}=${generation}`,
	)
}

async function deleteGeneration(
	strapi: Core.Strapi,
	uid: string,
	generation: number,
): Promise<void> {
	await strapi.db.query(uid).deleteMany({
		where: { Generation: generation },
	})
}

async function deleteOlderGenerations(
	strapi: Core.Strapi,
	uid: string,
	generation: number,
): Promise<void> {
	const oldestKept = generation - 1
	if (oldestKept <= 0) {
		return
	}
	await strapi.db.query(uid).deleteMany({
		where: { Generation: { $lt: oldestKept } },
	})
}

export async function importCsCsv(
	strapi: Core.Strapi,
	options: {
		uid: string
		files: unknown
		fieldName: string
		columns: CsCsvColumn[]
		identityAttribute: string
		generationField: 'ImportGenerationCSMembers' | 'ImportGenerationCSDogs'
	},
): Promise<CsCsvUploadResult> {
	const file = readUploadedCsv(options.files, options.fieldName)
	const filepath = file.filepath || file.path
	if (!filepath) {
		throw new CsCsvUploadError(`Die Datei ${options.fieldName} fehlt.`)
	}

	const content = await readFile(filepath, 'utf8')
	const table = parseCsv(content)
	const { records, skipped, unknownHeaders } = mapRows(
		table,
		options.columns,
		options.identityAttribute,
	)
	if (unknownHeaders.length > 0) {
		strapi.log.warn(
			`CSV ${options.fieldName}: unbekannte Spalten werden ignoriert: ${unknownHeaders.join(', ')}`,
		)
	}
	if (records.length === 0) {
		throw new CsCsvUploadError(
			skipped > 0
				? `Keine gültigen Datensätze. ${skipped} Zeilen wurden übersprungen.`
				: 'Die CSV-Datei enthält keine Datensätze.',
		)
	}

	const generation = await readCurrentGeneration(strapi, options.generationField) + 1
	const rows = records.map((record) => ({
		documentId: createDocumentId(),
		Generation: generation,
		...record,
	}))
	const batchSize = Math.max(
		1,
		Math.min(200, Math.floor(INSERT_PARAMETER_BUDGET / (options.columns.length + 5))),
	)

	try {
		await deleteGeneration(strapi, options.uid, generation)
		for (let index = 0; index < rows.length; index += batchSize) {
			await strapi.db.query(options.uid).createMany({
				data: rows.slice(index, index + batchSize),
			})
		}
		await storeImportResult(
			strapi,
			options.generationField,
			generation,
			new Date().toISOString(),
		)
	} catch (error) {
		await deleteGeneration(strapi, options.uid, generation).catch((cleanupError) => {
			strapi.log.error(cleanupError)
		})
		throw error
	}

	await deleteOlderGenerations(strapi, options.uid, generation)

	if (skipped > 0) {
		strapi.log.warn(
			`CSV ${options.fieldName}: ${skipped} Zeilen übersprungen, Generation ${generation}.`,
		)
	}
	strapi.log.info(
		`CSV ${options.fieldName}: ${rows.length} Datensätze in Generation ${generation} übernommen.`,
	)

	return {
		generation,
		imported: rows.length,
		skipped,
	}
}

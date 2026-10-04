import { createWriteStream, promises as fs } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import type { WriteStream } from 'fs'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../utils/document-pagination'

const HZD_SETTING_UID = 'api::hzd-setting.hzd-setting'
const CS_MEMBER_UID = 'api::cs-member.cs-member'
const CS_DOG_UID = 'api::cs-dog.cs-dog'
const PAGE_SIZE = 100
const LOG_DIR = path.join(tmpdir(), 'hzd-plugin-import-logs')

type GenerationField = 'ImportGenerationCSMembers' | 'ImportGenerationCSDogs'
type ImportPhase = 'idle' | 'members' | 'dogs' | 'done' | 'error'

interface Counts {
	processed: number
	total: number
	skipped: number
}

interface JobState {
	phase: ImportPhase
	members: Counts
	dogs: Counts
	logFileName: string | null
	logFilePath: string | null
	error: string | null
}

export interface ImportStrapiDatenStatus {
	phase: ImportPhase
	members: Counts
	dogs: Counts
	logFileName: string | null
	error: string | null
}

interface ImportOptions {
	onlyChanged: boolean
}

const IGNORED_FIELDS = new Set([
	'id',
	'documentId',
	'createdAt',
	'updatedAt',
	'publishedAt',
	'locale',
	'createdBy',
	'updatedBy',
	'localizations',
	'Generation',
])

function emptyCounts(): Counts {
	return { processed: 0, total: 0, skipped: 0 }
}

function idleJob(): JobState {
	return {
		phase: 'idle',
		members: emptyCounts(),
		dogs: emptyCounts(),
		logFileName: null,
		logFilePath: null,
		error: null,
	}
}

let job: JobState = idleJob()
let running = false

function snapshot(): ImportStrapiDatenStatus {
	const finished = job.phase === 'done' || job.phase === 'error'
	return {
		phase: job.phase,
		members: { ...job.members },
		dogs: { ...job.dogs },
		logFileName: finished ? job.logFileName : null,
		error: job.error,
	}
}

function readGeneration(value: unknown): number | null {
	if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
		return value
	}
	if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
		const parsed = Number.parseInt(value.trim(), 10)
		return parsed > 0 ? parsed : null
	}
	return null
}

function createTimestamp() {
	const now = new Date()
	const yyyy = now.getFullYear()
	const mm = String(now.getMonth() + 1).padStart(2, '0')
	const dd = String(now.getDate()).padStart(2, '0')
	const hh = String(now.getHours()).padStart(2, '0')
	const mi = String(now.getMinutes()).padStart(2, '0')
	const ss = String(now.getSeconds()).padStart(2, '0')
	return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

function yieldToEventLoop() {
	return new Promise<void>((resolve) => {
		setImmediate(resolve)
	})
}

async function loadCurrentGeneration(
	strapi: Core.Strapi,
	field: GenerationField,
): Promise<number | null> {
	const read = async (status: 'published' | 'draft') => {
		const settings = await strapi.documents(HZD_SETTING_UID).findFirst({
			status,
			fields: [field],
		})
		return readGeneration(settings?.[field])
	}

	return (await read('published')) ?? (await read('draft'))
}

async function countGeneration(
	strapi: Core.Strapi,
	uid: string,
	generation: number,
): Promise<number> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const total = await strapi.documents(uid as any).count({
		filters: { Generation: { $eq: generation } },
	})
	return typeof total === 'number' ? total : 0
}

async function loadGenerationPage(
	strapi: Core.Strapi,
	uid: string,
	generation: number,
	page: number,
) {
	return findDocumentsPage<Record<string, unknown>>(strapi, uid, {
		filters: { Generation: { $eq: generation } },
		page,
		pageSize: PAGE_SIZE,
	})
}

async function openLog(): Promise<{ stream: WriteStream; fileName: string; filePath: string }> {
	await fs.mkdir(LOG_DIR, { recursive: true })
	const fileName = `import-strapi-daten-${createTimestamp()}.log`
	const filePath = path.join(LOG_DIR, fileName)
	const stream = createWriteStream(filePath, { flags: 'w' })
	await new Promise<void>((resolve, reject) => {
		stream.once('open', () => resolve())
		stream.once('error', reject)
	})
	return { stream, fileName, filePath }
}

function writeLog(stream: WriteStream, line: string) {
	stream.write(`[${new Date().toISOString()}] ${line}\n`)
}

function closeLog(stream: WriteStream) {
	return new Promise<void>((resolve, reject) => {
		stream.end(() => resolve())
		stream.once('error', reject)
	})
}

function readRecordId(value: unknown): string {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value)
	}
	if (typeof value !== 'string') {
		return ''
	}
	const trimmed = value.trim()
	if (!trimmed || trimmed === '-') {
		return ''
	}
	return trimmed
}

function normalizeField(value: unknown): string {
	if (value === null || value === undefined) {
		return ''
	}
	if (typeof value === 'string') {
		return value
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value)
	}
	return JSON.stringify(value)
}

function comparableAttributes(strapi: Core.Strapi, uid: string): string[] {
	const model = strapi.getModel(uid as never) as {
		attributes?: Record<string, unknown>
	}
	return Object.keys(model?.attributes ?? {}).filter(
		(name) => !IGNORED_FIELDS.has(name),
	)
}

interface FieldChange {
	name: string
	previous: string
	current: string
}

function listFieldChanges(
	current: Record<string, unknown>,
	previous: Record<string, unknown>,
	attributes: string[],
): FieldChange[] {
	const names = attributes.length > 0
		? attributes
		: Object.keys(current).filter((name) => !IGNORED_FIELDS.has(name))
	const changes: FieldChange[] = []
	for (const name of names) {
		const previousValue = normalizeField(previous[name])
		const currentValue = normalizeField(current[name])
		if (previousValue === currentValue) {
			continue
		}
		changes.push({
			name,
			previous: previousValue,
			current: currentValue,
		})
	}
	return changes
}

function formatLogValue(value: string): string {
	return JSON.stringify(value)
}

async function loadGenerationById(
	strapi: Core.Strapi,
	uid: string,
	generation: number,
	idAttribute: string,
): Promise<Map<string, Record<string, unknown>>> {
	const byId = new Map<string, Record<string, unknown>>()
	if (generation < 1) {
		return byId
	}
	let page = 1
	while (true) {
		const result = await loadGenerationPage(strapi, uid, generation, page)
		for (const entry of result.results) {
			const recordId = readRecordId(entry[idAttribute])
			if (recordId) {
				byId.set(recordId, entry)
			}
		}
		if (page >= result.pagination.pageCount || result.results.length === 0) {
			break
		}
		page += 1
	}
	return byId
}

async function iterateGeneration(
	strapi: Core.Strapi,
	uid: string,
	generation: number,
	onItem: (entry: Record<string, unknown>, index: number) => void,
): Promise<number> {
	let page = 1
	let seen = 0

	while (true) {
		const result = await loadGenerationPage(strapi, uid, generation, page)
		for (const entry of result.results) {
			seen += 1
			onItem(entry, seen)
			await yieldToEventLoop()
		}
		if (page >= result.pagination.pageCount || result.results.length === 0) {
			break
		}
		page += 1
	}

	return seen
}

async function importCollection(
	strapi: Core.Strapi,
	options: {
		label: string
		uid: string
		generation: number
		idAttribute: string
		counts: Counts
		onlyChanged: boolean
		log: (line: string) => void
	},
) {
	const { label, uid, generation, idAttribute, counts, onlyChanged, log } = options
	const total = await countGeneration(strapi, uid, generation)
	counts.processed = 0
	counts.total = total
	counts.skipped = 0
	log(`${label} Generation ${generation}: ${total} Datensätze`)
	if (onlyChanged) {
		log(
			`${label}: nur geänderte Datensätze, Vergleich mit Generation ${generation - 1}`,
		)
	}

	const attributes = comparableAttributes(strapi, uid)
	const previousById = await loadGenerationById(
		strapi,
		uid,
		generation - 1,
		idAttribute,
	)

	let imported = 0
	let skipped = 0
	await iterateGeneration(strapi, uid, generation, (entry, index) => {
		const recordId = readRecordId(entry[idAttribute])
		const idLabel = recordId ? ` ${idAttribute}=${recordId}` : ''
		const previous = recordId ? previousById.get(recordId) : undefined
		const changes = previous
			? listFieldChanges(entry, previous, attributes)
			: null
		if (onlyChanged && previous && changes && changes.length === 0) {
			skipped += 1
			counts.skipped = skipped
			counts.processed = imported
			log(`${label} ${index}/${total}${idLabel} übersprungen (unverändert)`)
			return
		}
		imported += 1
		counts.processed = imported
		counts.skipped = skipped
		const documentId = typeof entry.documentId === 'string' ? entry.documentId : ''
		const changeNote = !previous
			? ' neu'
			: changes && changes.length > 0
				? ` geändert (${changes.length})`
				: ''
		log(
			`${label} ${index}/${total}${idLabel}${documentId ? ` documentId=${documentId}` : ''}${changeNote}`,
		)
		if (!changes) {
			return
		}
		for (const change of changes) {
			log(
				`${label}${idLabel} ${change.name}: ${formatLogValue(change.previous)} -> ${formatLogValue(change.current)}`,
			)
		}
	})
	counts.processed = imported
	counts.skipped = skipped
	log(
		`${label} abgeschlossen: ${imported}/${total}, übersprungen ${skipped}`,
	)
}

async function import_strapi_daten(
	strapi: Core.Strapi,
	options: ImportOptions,
) {
	const startedAt = Date.now()
	let stream: WriteStream | null = null

	try {
		const opened = await openLog()
		stream = opened.stream
		job.logFileName = opened.fileName
		job.logFilePath = opened.filePath
		const log = (line: string) => writeLog(opened.stream, line)
		log(
			options.onlyChanged
				? 'Import gestartet (nur geänderte Datensätze)'
				: 'Import gestartet',
		)
		const memberGeneration = await loadCurrentGeneration(
			strapi,
			'ImportGenerationCSMembers',
		)
		job.phase = 'members'
		if (!memberGeneration) {
			job.members = emptyCounts()
			log('CS_Member: keine ImportGeneration gesetzt')
		} else {
			await importCollection(strapi, {
				label: 'CS_Member',
				uid: CS_MEMBER_UID,
				generation: memberGeneration,
				idAttribute: 'IdPerson',
				counts: job.members,
				onlyChanged: options.onlyChanged,
				log,
			})
		}

		const dogGeneration = await loadCurrentGeneration(
			strapi,
			'ImportGenerationCSDogs',
		)
		job.phase = 'dogs'
		if (!dogGeneration) {
			job.dogs = emptyCounts()
			log('CS_Dog: keine ImportGeneration gesetzt')
		} else {
			await importCollection(strapi, {
				label: 'CS_Dog',
				uid: CS_DOG_UID,
				generation: dogGeneration,
				idAttribute: 'IdAnimal',
				counts: job.dogs,
				onlyChanged: options.onlyChanged,
				log,
			})
		}

		const duration = Date.now() - startedAt
		log(
			`Import abgeschlossen in ${duration}ms. CS_Member=${job.members.processed} (${job.members.skipped} übersprungen), CS_Dog=${job.dogs.processed} (${job.dogs.skipped} übersprungen)`,
		)
		job.phase = 'done'
		job.error = null
		strapi.log.info(
			`import_strapi_daten: ${job.members.processed} CS_Member, ${job.dogs.processed} CS_Dog, log=${job.logFileName}`,
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
		job.phase = 'error'
		job.error = message
		if (stream) {
			writeLog(stream, `Import fehlgeschlagen: ${message}`)
		}
		strapi.log.error(`import_strapi_daten fehlgeschlagen: ${message}`)
	} finally {
		if (stream) {
			await closeLog(stream).catch(() => undefined)
		}
		running = false
	}

	return snapshot()
}

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
	startImport(options?: Partial<ImportOptions>) {
		if (running) {
			return { started: false, status: snapshot() }
		}
		running = true
		const onlyChanged = options?.onlyChanged === true
		job = {
			...idleJob(),
			phase: 'members',
		}
		void import_strapi_daten(strapi, { onlyChanged })
		return { started: true, status: snapshot() }
	},

	getStatus() {
		return snapshot()
	},

	getDownloadableLog() {
		if (job.phase !== 'done' && job.phase !== 'error') {
			return null
		}
		if (!job.logFilePath || !job.logFileName) {
			return null
		}
		return {
			filePath: job.logFilePath,
			fileName: job.logFileName,
		}
	},

	import_strapi_daten() {
		if (running) {
			return Promise.reject(new Error('Import läuft bereits.'))
		}
		running = true
		job = {
			...idleJob(),
			phase: 'members',
		}
		return import_strapi_daten(strapi, { onlyChanged: false })
	},
})

export default service

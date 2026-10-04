import { createWriteStream, promises as fs } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import type { WriteStream } from 'fs'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../utils/document-pagination'
import {
	loadAuthenticatedRoleId,
	updateBreederFromUser,
	updateDog,
	updateStudDog,
	updateUser,
} from './cs-target-sync'

const HZD_SETTING_UID = 'api::hzd-setting.hzd-setting'
const CS_MEMBER_UID = 'api::cs-member.cs-member'
const CS_DOG_UID = 'api::cs-dog.cs-dog'
const USER_UID = 'plugin::users-permissions.user'
const DOG_UID = 'plugin::hzd-plugin.dog'
const PAGE_SIZE = 100
const LOG_DIR = path.join(tmpdir(), 'hzd-plugin-import-logs')

type GenerationField = 'ImportGenerationCSMembers' | 'ImportGenerationCSDogs'
type ImportPhase =
	| 'idle'
	| 'members'
	| 'dogs'
	| 'breeders'
	| 'studDogs'
	| 'done'
	| 'error'
type ImportStep = 'members' | 'dogs' | 'breeders' | 'studDogs'

interface Counts {
	processed: number
	total: number
	skipped: number
}

export interface ImportSteps {
	members: boolean
	dogs: boolean
	breeders: boolean
	studDogs: boolean
}

interface JobState {
	phase: ImportPhase
	steps: ImportSteps
	members: Counts
	dogs: Counts
	breeders: Counts
	studDogs: Counts
	logFileName: string | null
	logFilePath: string | null
	error: string | null
}

export interface ImportStrapiDatenStatus {
	phase: ImportPhase
	steps: ImportSteps
	members: Counts
	dogs: Counts
	breeders: Counts
	studDogs: Counts
	logFileName: string | null
	error: string | null
}

interface ImportOptions {
	onlyChanged: boolean
	steps: ImportSteps
}

const STEP_ORDER: ImportStep[] = ['members', 'dogs', 'breeders', 'studDogs']

function defaultSteps(): ImportSteps {
	return {
		members: true,
		dogs: true,
		breeders: true,
		studDogs: true,
	}
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
		steps: defaultSteps(),
		members: emptyCounts(),
		dogs: emptyCounts(),
		breeders: emptyCounts(),
		studDogs: emptyCounts(),
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
		steps: { ...job.steps },
		members: { ...job.members },
		dogs: { ...job.dogs },
		breeders: { ...job.breeders },
		studDogs: { ...job.studDogs },
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

function describeError(error: unknown): string {
	if (!error || typeof error !== 'object') {
		return error instanceof Error ? error.message : String(error)
	}

	const details = error as {
		message?: unknown
		errors?: unknown[]
		inner?: Array<{ path?: string; message?: string }>
		details?: { errors?: Array<{ path?: unknown; message?: unknown }> }
	}
	const parts: string[] = []

	if (Array.isArray(details.inner) && details.inner.length > 0) {
		for (const item of details.inner) {
			const path = typeof item.path === 'string' ? item.path : ''
			const message = typeof item.message === 'string' ? item.message : ''
			if (path && message) {
				parts.push(`${path}: ${message}`)
			} else if (message) {
				parts.push(message)
			}
		}
	} else if (
		Array.isArray(details.errors)
		&& details.errors.every((item) => typeof item === 'string')
	) {
		parts.push(...details.errors)
	} else if (Array.isArray(details.details?.errors)) {
		for (const item of details.details.errors) {
			const path = Array.isArray(item.path)
				? item.path.map(String).join('.')
				: ''
			const message = typeof item.message === 'string' ? item.message : ''
			if (path && message) {
				parts.push(`${path}: ${message}`)
			} else if (message) {
				parts.push(message)
			}
		}
	}

	const nested = 'errors' in error && Array.isArray(error.errors)
		? error.errors
		: []
	const errorName = 'name' in error ? error.name : ''
	if (parts.length === 0 && errorName === 'AggregateError') {
		parts.push(...nested.map((item) => describeError(item)))
	}
	if (parts.length > 0) {
		return parts.join('; ')
	}
	if (typeof details.message === 'string' && details.message) {
		return details.message
	}
	return 'Unbekannter Fehler'
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
	onItem: (
		entry: Record<string, unknown>,
		index: number,
	) => void | Promise<void>,
): Promise<number> {
	let page = 1
	let seen = 0

	while (true) {
		const result = await loadGenerationPage(strapi, uid, generation, page)
		for (const entry of result.results) {
			seen += 1
			await onItem(entry, seen)
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
		apply?: (entry: Record<string, unknown>) => Promise<void>
	},
) {
	const {
		label,
		uid,
		generation,
		idAttribute,
		counts,
		onlyChanged,
		log,
		apply,
	} = options
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
	let failed = 0
	await iterateGeneration(strapi, uid, generation, async (entry, index) => {
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
		if (changes) {
			for (const change of changes) {
				log(
					`${label}${idLabel} ${change.name}: ${formatLogValue(change.previous)} -> ${formatLogValue(change.current)}`,
				)
			}
		}
		if (apply) {
			try {
				await apply(entry)
			} catch (error) {
				failed += 1
				const message = describeError(error)
				const line = `${label}${idLabel} fehlgeschlagen: ${message}`
				log(line)
				strapi.log.error(`import_strapi_daten ${line}`)
			}
		}
	})
	counts.processed = imported
	counts.skipped = skipped
	log(
		`${label} abgeschlossen: ${imported}/${total}, übersprungen ${skipped}, fehlgeschlagen ${failed}`,
	)
	return failed
}

async function countFiltered(
	strapi: Core.Strapi,
	uid: string,
	filters: Record<string, unknown>,
): Promise<number> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const total = await strapi.documents(uid as any).count({ filters })
	return typeof total === 'number' ? total : 0
}

async function runEntityStep(
	strapi: Core.Strapi,
	options: {
		label: string
		uid: string
		filters: Record<string, unknown>
		idAttribute: string
		counts: Counts
		log: (line: string) => void
		apply: (entry: Record<string, unknown>) => Promise<void>
	},
): Promise<number> {
	const { label, uid, filters, idAttribute, counts, log, apply } = options
	const total = await countFiltered(strapi, uid, filters)
	counts.processed = 0
	counts.total = total
	counts.skipped = 0
	log(`${label}: ${total} Datensätze`)

	let imported = 0
	let failed = 0
	let page = 1
	while (true) {
		const result = await findDocumentsPage<Record<string, unknown>>(strapi, uid, {
			filters,
			page,
			pageSize: PAGE_SIZE,
		})
		for (const entry of result.results) {
			imported += 1
			counts.processed = imported
			const recordId = readRecordId(entry[idAttribute])
			const idLabel = recordId ? ` ${idAttribute}=${recordId}` : ''
			log(`${label} ${imported}/${total}${idLabel}`)
			try {
				await apply(entry)
			} catch (error) {
				failed += 1
				const message = describeError(error)
				const line = `${label}${idLabel} fehlgeschlagen: ${message}`
				log(line)
				strapi.log.error(`import_strapi_daten ${line}`)
			}
			await yieldToEventLoop()
		}
		if (page >= result.pagination.pageCount || result.results.length === 0) {
			break
		}
		page += 1
	}

	counts.processed = imported
	log(`${label} abgeschlossen: ${imported}/${total}, fehlgeschlagen ${failed}`)
	return failed
}

async function loadBreedingStations(
	strapi: Core.Strapi,
	generation: number | null,
): Promise<Map<string, string>> {
	const byPerson = new Map<string, string>()
	if (!generation) {
		return byPerson
	}
	let page = 1
	while (true) {
		const result = await loadGenerationPage(strapi, CS_MEMBER_UID, generation, page)
		for (const entry of result.results) {
			const personId = readRecordId(entry.IdPerson)
			const station = typeof entry.BreedingStation === 'string'
				? entry.BreedingStation.trim()
				: ''
			if (!personId || !station || station === '-') {
				continue
			}
			byPerson.set(personId, station.slice(0, 200))
		}
		if (page >= result.pagination.pageCount || result.results.length === 0) {
			break
		}
		page += 1
	}
	return byPerson
}

function firstEnabledStep(steps: ImportSteps): ImportStep | null {
	return STEP_ORDER.find((step) => steps[step]) ?? null
}

function normalizeSteps(value: Partial<ImportSteps> | undefined): ImportSteps {
	const steps = defaultSteps()
	if (!value) {
		return steps
	}
	for (const step of STEP_ORDER) {
		if (typeof value[step] === 'boolean') {
			steps[step] = value[step]
		}
	}
	return steps
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
		const authenticatedRoleId = await loadAuthenticatedRoleId(strapi)
		let failed = 0
		const { steps } = options

		if (steps.members) {
			job.phase = 'members'
			const memberGeneration = await loadCurrentGeneration(
				strapi,
				'ImportGenerationCSMembers',
			)
			if (!memberGeneration) {
				job.members = emptyCounts()
				log('Verarbeite CS_Member: keine ImportGeneration gesetzt')
			} else {
				failed += await importCollection(strapi, {
					label: 'Verarbeite CS_Member',
					uid: CS_MEMBER_UID,
					generation: memberGeneration,
					idAttribute: 'IdPerson',
					counts: job.members,
					onlyChanged: options.onlyChanged,
					log,
					apply: (entry) => updateUser(
						strapi,
						entry,
						authenticatedRoleId,
						log,
					),
				})
			}
		} else {
			log('Verarbeite CS_Member übersprungen')
		}

		if (steps.dogs) {
			job.phase = 'dogs'
			const dogGeneration = await loadCurrentGeneration(
				strapi,
				'ImportGenerationCSDogs',
			)
			if (!dogGeneration) {
				job.dogs = emptyCounts()
				log('Verarbeite CS_Dog: keine ImportGeneration gesetzt')
			} else {
				failed += await importCollection(strapi, {
					label: 'Verarbeite CS_Dog',
					uid: CS_DOG_UID,
					generation: dogGeneration,
					idAttribute: 'IdAnimal',
					counts: job.dogs,
					onlyChanged: options.onlyChanged,
					log,
					apply: (entry) => updateDog(strapi, entry, log),
				})
			}
		} else {
			log('Verarbeite CS_Dog übersprungen')
		}

		if (steps.breeders) {
			job.phase = 'breeders'
			const memberGeneration = await loadCurrentGeneration(
				strapi,
				'ImportGenerationCSMembers',
			)
			const breedingStations = await loadBreedingStations(
				strapi,
				memberGeneration,
			)
			failed += await runEntityStep(strapi, {
				label: 'Aktualisiere Züchterdaten',
				uid: USER_UID,
				filters: { cFlagBreeder: { $eq: true } },
				idAttribute: 'cId',
				counts: job.breeders,
				log,
				apply: (entry) => {
					const personId = readRecordId(entry.cId)
					return updateBreederFromUser(
						strapi,
						entry,
						personId ? breedingStations.get(personId) ?? null : null,
						log,
					)
				},
			})
		} else {
			log('Aktualisiere Züchterdaten übersprungen')
		}

		if (steps.studDogs) {
			job.phase = 'studDogs'
			failed += await runEntityStep(strapi, {
				label: 'Aktualisiere Deckrüden',
				uid: DOG_UID,
				filters: {
					sex: { $eq: 'M' },
					cFertile: { $eq: true },
				},
				idAttribute: 'cId',
				counts: job.studDogs,
				log,
				apply: (entry) => updateStudDog(strapi, entry, log),
			})
		} else {
			log('Aktualisiere Deckrüden übersprungen')
		}

		const duration = Date.now() - startedAt
		log(
			`Import abgeschlossen in ${duration}ms. CS_Member=${job.members.processed} (${job.members.skipped} übersprungen), CS_Dog=${job.dogs.processed} (${job.dogs.skipped} übersprungen), Züchter=${job.breeders.processed}, Deckrüden=${job.studDogs.processed}, fehlgeschlagen=${failed}`,
		)
		job.phase = 'done'
		job.error = failed > 0
			? `${failed} Datensätze fehlgeschlagen, Details im Import-Log`
			: null
		strapi.log.info(
			`import_strapi_daten: ${job.members.processed} CS_Member, ${job.dogs.processed} CS_Dog, ${job.breeders.processed} Züchter, ${job.studDogs.processed} Deckrüden, fehlgeschlagen=${failed}, log=${job.logFileName}`,
		)
	} catch (error) {
		const message = describeError(error)
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
			return { started: false, reason: 'running' as const, status: snapshot() }
		}
		const steps = normalizeSteps(options?.steps)
		if (!firstEnabledStep(steps)) {
			return { started: false, reason: 'no-steps' as const, status: snapshot() }
		}
		running = true
		const onlyChanged = options?.onlyChanged === true
		const phase = firstEnabledStep(steps) ?? 'members'
		job = {
			...idleJob(),
			phase,
			steps,
		}
		void import_strapi_daten(strapi, { onlyChanged, steps })
		return { started: true, reason: null, status: snapshot() }
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
		const steps = defaultSteps()
		job = {
			...idleJob(),
			phase: 'members',
			steps,
		}
		return import_strapi_daten(strapi, { onlyChanged: false, steps })
	},
})

export default service

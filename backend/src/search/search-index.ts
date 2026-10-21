import { timingSafeEqual } from 'crypto'
import type { Index, Meilisearch } from 'meilisearch'
import type { Core } from '@strapi/strapi'
import { buildPageSectionsPopulate } from '../utils/page-sections-populate'
import { extractPlainText, firstSeoValue, htmlToText } from './extract-text'

export const SEARCH_INDEX_UID = 'hzd_content'
export const PAGE_UID = 'api::page.page'
export const NEWS_ARTICLE_UID = 'api::news-article.news-article'
export const DOG_UID = 'plugin::hzd-plugin.dog'
export const BREEDER_UID = 'plugin::hzd-plugin.breeder'

const BREEDER_INDEX_FIELDS = [
	'documentId',
	'kennelName',
	'Slug',
	'BreederRole',
	'IsActive',
	'Disable',
	'BreedersIntroduction',
	'updatedAt',
]

const BREEDER_INDEX_POPULATE = {
	Address: true,
	owner_members: {
		fields: ['firstName', 'lastName'],
	},
}

const DOG_INDEX_FIELDS = [
	'documentId',
	'givenName',
	'fullKennelName',
	'Slug',
	'cFertile',
	'Disabled',
	'MemosReleased',
	'Exhibitions',
	'BreedSurvey',
	'cStudBookNumber',
	'updatedAt',
]

const NEWS_SECTION_COMPONENTS = [
	'blocks.text-columns-section',
	'blocks.teaser-text-with-image',
	'blocks.supplemental-document-group-section',
	'blocks.simple-cta-section',
	'blocks.rich-text-section',
	'blocks.image-gallery-section',
	'blocks.detailed-image-gallery-section',
	'blocks.contact-group-section',
	'blocks.card-section',
] as const

const SYNC_ACTIONS = new Set([
	'create',
	'update',
	'delete',
	'publish',
	'unpublish',
])

export interface SearchDocument {
	id: string
	type: 'page' | 'news-article' | 'dog' | 'breeder'
	typeLabel: 'Seite' | 'News' | 'Hund' | 'Züchter' | 'Deckrüdenbesitzer'
	title: string
	excerpt: string
	content: string
	slug: string
	url: string
	updatedAt: string
}

interface ReindexState {
	running: boolean
	lastFinishedAt: string | null
	lastError: string | null
	indexed: number
	removed: number
}

const state: ReindexState = {
	running: false,
	lastFinishedAt: null,
	lastError: null,
	indexed: 0,
	removed: 0,
}

const pending = new Map<string, () => Promise<void>>()
let lastConnectionWarningAt = 0

export function isSearchEnabled(): boolean {
	return Boolean(
		process.env.MEILI_HOST
		|| process.env.MEILI_MASTER_KEY
		|| process.env.MEILI_API_KEY,
	)
}

function meiliHost(): string {
	return process.env.MEILI_HOST || 'http://127.0.0.1:7700'
}

function meiliApiKey(): string | undefined {
	const key = process.env.MEILI_MASTER_KEY || process.env.MEILI_API_KEY
	return key && key.trim() ? key.trim() : undefined
}

async function client(): Promise<Meilisearch> {
	const { Meilisearch: MeilisearchClient } = await import('meilisearch')
	return new MeilisearchClient({
		host: meiliHost(),
		apiKey: meiliApiKey(),
	})
}

async function waitForTask(indexClient: Meilisearch, task: { taskUid: number }) {
	const finished = await indexClient.tasks.waitForTask(task.taskUid)
	if (finished.status === 'failed') {
		const message = finished.error && typeof finished.error === 'object'
			? (finished.error as { message?: string }).message
			: undefined
		throw new Error(message || 'Meilisearch-Task fehlgeschlagen')
	}
	return finished
}

function isMissingIndex(error: unknown): boolean {
	if (!error || typeof error !== 'object') {
		return false
	}
	const cause = (error as { cause?: { code?: string } }).cause
	return cause?.code === 'index_not_found'
}

function warnConnection(strapi: Core.Strapi, error: unknown) {
	const now = Date.now()
	if (now - lastConnectionWarningAt < 60_000) {
		return
	}
	lastConnectionWarningAt = now
	strapi.log.warn(
		`[Search] Meilisearch unter ${meiliHost()} nicht erreichbar: ${error instanceof Error ? error.message : String(error)}`,
	)
}

export function tokensMatch(provided: unknown, expected: string | undefined): boolean {
	if (typeof provided !== 'string' || !expected) {
		return false
	}
	const actual = Buffer.from(provided)
	const wanted = Buffer.from(expected)
	if (actual.length !== wanted.length) {
		return false
	}
	return timingSafeEqual(actual, wanted)
}

export function readBearerOrHeader(
	headers: Record<string, unknown>,
	headerName: string,
): string | undefined {
	const direct = headers[headerName]
	if (typeof direct === 'string' && direct.trim()) {
		return direct.trim()
	}
	const authorization = headers.authorization
	if (typeof authorization === 'string' && authorization.toLowerCase().startsWith('bearer ')) {
		return authorization.slice(7).trim()
	}
	return undefined
}

function toPath(slug: unknown): string {
	if (typeof slug !== 'string') {
		return ''
	}
	const value = slug.trim()
	if (!value) {
		return ''
	}
	return value.startsWith('/') ? value : `/${value}`
}

function excerptFrom(preferred: string, content: string): string {
	const source = preferred.trim() || content
	if (source.length <= 240) {
		return source
	}
	return `${source.slice(0, 237).trimEnd()}...`
}

function isPublicPage(entry: Record<string, unknown>): boolean {
	const restriction = entry.Restriction
	if (!restriction || typeof restriction !== 'object') {
		return true
	}
	return (restriction as Record<string, unknown>).Public !== false
}

function documentIdOf(entry: Record<string, unknown>): string {
	const documentId = entry.documentId
	return typeof documentId === 'string' ? documentId : ''
}

function indexDocumentId(uid: string, documentId: string): string {
	if (uid === PAGE_UID) {
		return `page_${documentId}`
	}
	if (uid === NEWS_ARTICLE_UID) {
		return `news_${documentId}`
	}
	if (uid === BREEDER_UID) {
		return `breeder_${documentId}`
	}
	return `dog_${documentId}`
}

function isIndexableDog(entry: Record<string, unknown>): boolean {
	if (entry.cFertile !== true) {
		return false
	}
	return entry.Disabled !== true
}

function publicPathKey(entry: Record<string, unknown>): string {
	const slug = typeof entry.Slug === 'string' ? entry.Slug.trim() : ''
	const segment = slug.replace(/^\/+/, '')
	if (segment) {
		return segment
	}
	return documentIdOf(entry)
}

function isIndexableBreeder(entry: Record<string, unknown>): boolean {
	if (entry.IsActive !== true) {
		return false
	}
	return entry.Disable !== true
}

function breederPersonName(entry: Record<string, unknown>): string {
	const address = entry.Address
	if (address && typeof address === 'object' && !Array.isArray(address)) {
		const fullName = (address as { FullName?: unknown }).FullName
		if (typeof fullName === 'string' && fullName.trim()) {
			return htmlToText(fullName)
		}
	}

	const members = Array.isArray(entry.owner_members) ? entry.owner_members : []
	const names = members
		.map((member) => {
			if (!member || typeof member !== 'object') {
				return ''
			}
			const record = member as { firstName?: unknown; lastName?: unknown }
			return [record.firstName, record.lastName]
				.filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
				.join(' ')
		})
		.filter(Boolean)

	return htmlToText(names.join(', '))
}

export function toSearchDocument(
	uid: string,
	entry: Record<string, unknown>,
): SearchDocument | null {
	const documentId = documentIdOf(entry)
	if (!documentId) {
		return null
	}

	if (uid === PAGE_UID) {
		if (!isPublicPage(entry)) {
			return null
		}
		const slug = toPath(entry.slug)
		if (!slug) {
			return null
		}
		const content = extractPlainText(entry.Sections)
		const description = firstSeoValue(entry.SEO, 'MetaDescription')
		const title = htmlToText(
			(typeof entry.title === 'string' && entry.title)
			|| firstSeoValue(entry.SEO, 'TitleTag')
			|| slug,
		)
		return {
			id: `page_${documentId}`,
			type: 'page',
			typeLabel: 'Seite',
			title,
			excerpt: excerptFrom(description, content),
			content,
			slug,
			url: slug,
			updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
		}
	}

	if (uid === NEWS_ARTICLE_UID) {
		const slug = toPath(entry.Slug)
		if (!slug) {
			return null
		}
		const content = extractPlainText(entry.NewsContentSections)
		const teaser = htmlToText(
			(typeof entry.TeaserText === 'string' && entry.TeaserText)
			|| (typeof entry.SubHeadline === 'string' && entry.SubHeadline)
			|| firstSeoValue(entry.SEO, 'MetaDescription')
			|| '',
		)
		const title = htmlToText(
			(typeof entry.Headline === 'string' && entry.Headline)
			|| firstSeoValue(entry.SEO, 'TitleTag')
			|| slug,
		)
		return {
			id: `news_${documentId}`,
			type: 'news-article',
			typeLabel: 'News',
			title,
			excerpt: excerptFrom(teaser, content),
			content,
			slug,
			url: `/article${slug}`,
			updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
		}
	}

	if (uid === DOG_UID) {
		if (!isIndexableDog(entry)) {
			return null
		}
		const key = publicPathKey(entry)
		if (!key) {
			return null
		}
		const givenName = htmlToText(
			typeof entry.givenName === 'string' ? entry.givenName : '',
		)
		const kennelName = htmlToText(
			typeof entry.fullKennelName === 'string' ? entry.fullKennelName : '',
		)
		const memo = htmlToText(
			typeof entry.MemosReleased === 'string' ? entry.MemosReleased : '',
		)
		const content = [
			givenName,
			kennelName,
			typeof entry.cStudBookNumber === 'string' ? entry.cStudBookNumber : '',
			typeof entry.Exhibitions === 'string' ? entry.Exhibitions : '',
			typeof entry.BreedSurvey === 'string' ? entry.BreedSurvey : '',
			memo,
		].map((part) => htmlToText(part)).filter(Boolean).join(' ')
		const title = kennelName || givenName || 'Hund'
		const url = `/dog/${encodeURIComponent(key)}`
		return {
			id: `dog_${documentId}`,
			type: 'dog',
			typeLabel: 'Hund',
			title,
			excerpt: excerptFrom(memo || givenName, content),
			content,
			slug: url,
			url,
			updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
		}
	}

	if (uid === BREEDER_UID) {
		if (!isIndexableBreeder(entry)) {
			return null
		}
		const key = publicPathKey(entry)
		if (!key) {
			return null
		}
		const isStudOwner = entry.BreederRole === 'S'
		const kennelName = isStudOwner
			? ''
			: htmlToText(typeof entry.kennelName === 'string' ? entry.kennelName : '')
		const personName = breederPersonName(entry)
		const intro = htmlToText(
			typeof entry.BreedersIntroduction === 'string' ? entry.BreedersIntroduction : '',
		)
		const content = [kennelName, personName, intro]
			.map((part) => htmlToText(part))
			.filter(Boolean)
			.join(' ')
		const title = isStudOwner
			? (personName || 'Deckrüdenbesitzer')
			: (kennelName || personName || 'Züchter')
		const url = `/breeder/${encodeURIComponent(key)}`
		return {
			id: `breeder_${documentId}`,
			type: 'breeder',
			typeLabel: isStudOwner ? 'Deckrüdenbesitzer' : 'Züchter',
			title,
			excerpt: excerptFrom(intro || personName, content),
			content,
			slug: url,
			url,
			updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
		}
	}

	return null
}

function pagePopulate() {
	return {
		Sections: buildPageSectionsPopulate(),
		Restriction: true,
		SEO: true,
	}
}

function newsPopulate() {
	const pageOn = buildPageSectionsPopulate().on as Record<string, unknown>
	const on: Record<string, unknown> = {}
	for (const component of NEWS_SECTION_COMPONENTS) {
		if (pageOn[component]) {
			on[component] = pageOn[component]
		}
	}
	return {
		SEO: true,
		category: true,
		news_article_tags: true,
		NewsContentSections: { on },
	}
}

function populateFor(uid: string) {
	return uid === PAGE_UID ? pagePopulate() : newsPopulate()
}

async function getOrCreateIndex(indexClient: Meilisearch): Promise<Index> {
	try {
		return await indexClient.getIndex(SEARCH_INDEX_UID)
	} catch {
		const created = await indexClient.createIndex(SEARCH_INDEX_UID, { primaryKey: 'id' })
		await waitForTask(indexClient, created)
		return indexClient.index(SEARCH_INDEX_UID)
	}
}

async function applyIndexSettings(indexClient: Meilisearch, index: Index) {
	const settingsTask = await index.updateSettings({
		searchableAttributes: ['title', 'excerpt', 'content', 'slug'],
		displayedAttributes: ['id', 'type', 'typeLabel', 'title', 'excerpt', 'url', 'slug'],
		filterableAttributes: ['type'],
		typoTolerance: { enabled: true },
	})
	await waitForTask(indexClient, settingsTask)
}

async function loadPublished(
	strapi: Core.Strapi,
	uid: string,
): Promise<Record<string, unknown>[]> {
	const pageSize = 50
	let start = 0
	const all: Record<string, unknown>[] = []

	while (true) {
		const batch = await strapi.documents(uid as never).findMany({
			status: 'published',
			populate: populateFor(uid) as never,
			start,
			limit: pageSize,
		}) as Record<string, unknown>[]
		const items = Array.isArray(batch) ? batch : []
		all.push(...items)
		if (items.length < pageSize) {
			break
		}
		start += pageSize
	}

	return all
}

async function loadIndexableDogs(
	strapi: Core.Strapi,
): Promise<Record<string, unknown>[]> {
	const pageSize = 50
	let start = 0
	const all: Record<string, unknown>[] = []
	const filters = {
		$and: [
			{ cFertile: { $eq: true } },
			{
				$or: [
					{ Disabled: { $eq: false } },
					{ Disabled: { $null: true } },
				],
			},
		],
	}

	while (true) {
		const batch = await strapi.documents(DOG_UID as never).findMany({
			filters,
			fields: DOG_INDEX_FIELDS,
			start,
			limit: pageSize,
		}) as Record<string, unknown>[]
		const items = Array.isArray(batch) ? batch : []
		all.push(...items)
		if (items.length < pageSize) {
			break
		}
		start += pageSize
	}

	return all
}

async function loadIndexableBreeders(
	strapi: Core.Strapi,
): Promise<Record<string, unknown>[]> {
	const pageSize = 50
	let start = 0
	const all: Record<string, unknown>[] = []
	const filters = {
		$and: [
			{ IsActive: { $eq: true } },
			{
				$or: [
					{ Disable: { $eq: false } },
					{ Disable: { $null: true } },
				],
			},
		],
	}

	while (true) {
		const batch = await strapi.documents(BREEDER_UID as never).findMany({
			filters,
			fields: BREEDER_INDEX_FIELDS,
			populate: BREEDER_INDEX_POPULATE as never,
			start,
			limit: pageSize,
		}) as Record<string, unknown>[]
		const items = Array.isArray(batch) ? batch : []
		all.push(...items)
		if (items.length < pageSize) {
			break
		}
		start += pageSize
	}

	return all
}

async function existingDocumentIds(index: Index): Promise<string[]> {
	const ids: string[] = []
	const limit = 1000
	let offset = 0

	while (true) {
		const page = await index.getDocuments<{ id: string }>({
			fields: ['id'],
			limit,
			offset,
		})
		const results = page.results ?? []
		ids.push(...results.map((entry) => entry.id).filter(Boolean))
		if (results.length < limit) {
			break
		}
		offset += limit
	}

	return ids
}

export function getReindexState(): ReindexState {
	return { ...state }
}

export async function reindexAll(strapi: Core.Strapi): Promise<ReindexState> {
	if (!isSearchEnabled()) {
		throw new Error('Meilisearch ist nicht konfiguriert')
	}

	if (state.running) {
		return getReindexState()
	}

	state.running = true
	state.lastError = null

	try {
		const indexClient = await client()
		const index = await getOrCreateIndex(indexClient)
		await applyIndexSettings(indexClient, index)
		const [pages, articles, dogs, breeders] = await Promise.all([
			loadPublished(strapi, PAGE_UID),
			loadPublished(strapi, NEWS_ARTICLE_UID),
			loadIndexableDogs(strapi),
			loadIndexableBreeders(strapi),
		])
		const documents = [
			...pages.map((entry) => toSearchDocument(PAGE_UID, entry)),
			...articles.map((entry) => toSearchDocument(NEWS_ARTICLE_UID, entry)),
			...dogs.map((entry) => toSearchDocument(DOG_UID, entry)),
			...breeders.map((entry) => toSearchDocument(BREEDER_UID, entry)),
		].filter((entry): entry is SearchDocument => entry !== null)

		const batchSize = 100
		for (let offset = 0; offset < documents.length; offset += batchSize) {
			const batch = documents.slice(offset, offset + batchSize)
			if (batch.length === 0) {
				continue
			}
			const task = await index.addDocuments(batch)
			await waitForTask(indexClient, task)
		}

		const keep = new Set(documents.map((entry) => entry.id))
		const stale = (await existingDocumentIds(index)).filter((id) => !keep.has(id))
		if (stale.length > 0) {
			const task = await index.deleteDocuments(stale)
			await waitForTask(indexClient, task)
		}

		state.indexed = documents.length
		state.removed = stale.length
		state.lastFinishedAt = new Date().toISOString()
		strapi.log.info(
			`[Search] Vollindexierung abgeschlossen: ${documents.length} Dokumente, ${stale.length} entfernt`,
		)
	} catch (error) {
		state.lastError = error instanceof Error ? error.message : String(error)
		warnConnection(strapi, error)
		throw error
	} finally {
		state.running = false
		const queued = [...pending.values()]
		pending.clear()
		for (const job of queued) {
			try {
				await job()
			} catch (error) {
				strapi.log.error('[Search] Nachgezogene Index-Aktualisierung fehlgeschlagen', error)
			}
		}
	}

	return getReindexState()
}

async function removeFromIndex(strapi: Core.Strapi, id: string) {
	const indexClient = await client()
	try {
		await indexClient.getIndex(SEARCH_INDEX_UID)
	} catch (error) {
		if (isMissingIndex(error)) {
			return
		}
		throw error
	}
	const index = indexClient.index(SEARCH_INDEX_UID)
	const task = await index.deleteDocument(id)
	await waitForTask(indexClient, task)
	strapi.log.debug(`[Search] Dokument entfernt: ${id}`)
}

async function loadEntryForIndex(
	strapi: Core.Strapi,
	uid: string,
	documentId: string,
): Promise<Record<string, unknown> | null> {
	if (uid === DOG_UID) {
		return await strapi.documents(DOG_UID as never).findOne({
			documentId,
			fields: DOG_INDEX_FIELDS,
		}) as Record<string, unknown> | null
	}

	if (uid === BREEDER_UID) {
		return await strapi.documents(BREEDER_UID as never).findOne({
			documentId,
			fields: BREEDER_INDEX_FIELDS,
			populate: BREEDER_INDEX_POPULATE as never,
		}) as Record<string, unknown> | null
	}

	return await strapi.documents(uid as never).findOne({
		documentId,
		status: 'published',
		populate: populateFor(uid) as never,
	}) as Record<string, unknown> | null
}

async function upsertFromDatabase(strapi: Core.Strapi, uid: string, documentId: string) {
	const published = await loadEntryForIndex(strapi, uid, documentId)

	const indexId = indexDocumentId(uid, documentId)
	const document = published ? toSearchDocument(uid, published) : null

	if (!document) {
		await removeFromIndex(strapi, indexId)
		return
	}

	const indexClient = await client()
	const index = await getOrCreateIndex(indexClient)
	const task = await index.addDocuments([document])
	await waitForTask(indexClient, task)
	strapi.log.debug(`[Search] Dokument aktualisiert: ${document.id}`)
}

function enqueueOrRun(strapi: Core.Strapi, key: string, job: () => Promise<void>) {
	if (state.running) {
		pending.set(key, job)
		return Promise.resolve()
	}
	return job().catch((error) => {
		warnConnection(strapi, error)
	})
}

export function syncEntry(
	strapi: Core.Strapi,
	uid: string,
	documentId: string,
	remove: boolean,
) {
	if (!isSearchEnabled()) {
		return Promise.resolve()
	}

	const key = `${uid}:${documentId}`
	return enqueueOrRun(strapi, key, async () => {
		if (remove) {
			await removeFromIndex(strapi, indexDocumentId(uid, documentId))
			return
		}
		await upsertFromDatabase(strapi, uid, documentId)
	})
}

export function registerSearchDocumentMiddleware(strapi: Core.Strapi) {
	strapi.documents.use(async (context, next) => {
		const result = await next()
		const uid = context.uid
		if (
			uid !== PAGE_UID
			&& uid !== NEWS_ARTICLE_UID
			&& uid !== DOG_UID
			&& uid !== BREEDER_UID
		) {
			return result
		}
		if (!isSearchEnabled() || !SYNC_ACTIONS.has(context.action)) {
			return result
		}

		const params = (context.params ?? {}) as { documentId?: string; status?: string }
		const resultRecord = result && typeof result === 'object'
			? result as { documentId?: string }
			: undefined
		const documentId = params.documentId ?? resultRecord?.documentId
		if (!documentId) {
			return result
		}

		const isDraftWrite = (context.action === 'create' || context.action === 'update')
			&& params.status === 'draft'
		if (isDraftWrite) {
			return result
		}

		await syncEntry(strapi, uid, documentId, false)
		return result
	})
}

function uidFromWebhook(body: Record<string, unknown>): string | null {
	if (
		body.uid === PAGE_UID
		|| body.uid === NEWS_ARTICLE_UID
		|| body.uid === DOG_UID
		|| body.uid === BREEDER_UID
	) {
		return body.uid
	}
	const model = typeof body.model === 'string' ? body.model : ''
	if (model === 'page') {
		return PAGE_UID
	}
	if (model === 'news-article') {
		return NEWS_ARTICLE_UID
	}
	if (model === 'dog') {
		return DOG_UID
	}
	if (model === 'breeder') {
		return BREEDER_UID
	}
	return null
}

export async function handleSearchWebhook(strapi: Core.Strapi, body: Record<string, unknown>) {
	const uid = uidFromWebhook(body)
	const entry = body.entry
	const documentId = entry && typeof entry === 'object'
		? (entry as { documentId?: string }).documentId
		: undefined
	if (!uid || !documentId) {
		return { ignored: true }
	}

	const event = typeof body.event === 'string' ? body.event : ''
	await syncEntry(strapi, uid, documentId, false)
	return { ignored: false, uid, documentId, event }
}

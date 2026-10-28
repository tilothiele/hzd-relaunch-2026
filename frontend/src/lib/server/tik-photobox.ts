import {
	fetchStrapiServer,
	getStrapiPublicBaseUrl,
} from '@/lib/server/strapi-client'
import {
	deletePhotoboxRawFile,
	getPhotoboxRawFile,
	guessContentTypeFromKey,
	isPhotoboxWebDavConfigured,
} from '@/lib/server/photobox-webdav'
import type {
	TikPhotoboxCollection,
	TikPhotoboxPhoto,
	TikPhotoboxSearchResult,
} from '@/lib/tik-photobox'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import {
	extractStrapiList,
	extractStrapiPagination,
	extractStrapiSingle,
} from '@/lib/strapi/normalize'
import { deleteEntity } from '@/lib/strapi/api'

const PAGE_SIZES = [5, 10, 20, 50, 100] as const
const IMAGE_SCAN_PAGE_SIZE = 100
const MAX_IMAGE_SCAN_PAGES = 20

const COLLECTION_POPULATE = new URLSearchParams({
	'populate[photogapher][fields][0]': 'documentId',
	'populate[photogapher][fields][1]': 'membershipNumber',
	'populate[photogapher][fields][2]': 'firstName',
	'populate[photogapher][fields][3]': 'lastName',
	'populate[photogapher][fields][4]': 'DisplayName',
	'populate[photogapher][fields][5]': 'username',
	'populate[photos][populate][Thumbnail]': 'true',
	'populate[photos][sort][0]': 'createdAt:desc',
})

export interface TikPhotoboxSearchInput {
	photographerQuery: string | null
	term: string | null
	page: number
	pageSize: number
}

export interface TikPhotoboxFile {
	buffer: Buffer
	contentType: string
	fileName: string
}

function apiToken(): string {
	const token = process.env.STRAPI_API_TOKEN?.trim()
	if (!token) {
		throw new Error('STRAPI_API_TOKEN ist nicht gesetzt.')
	}
	return token
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}
	return value as Record<string, unknown>
}

function unwrapEntity(value: unknown): Record<string, unknown> | null {
	const record = asRecord(value)
	if (!record) {
		return null
	}
	const data = record.data
	if (data && typeof data === 'object' && !Array.isArray(data)) {
		return data as Record<string, unknown>
	}
	return record
}

function unwrapList(value: unknown): Record<string, unknown>[] {
	if (Array.isArray(value)) {
		return value
			.map(unwrapEntity)
			.filter((item): item is Record<string, unknown> => item !== null)
	}
	const record = asRecord(value)
	if (!record || !Array.isArray(record.data)) {
		return []
	}
	return record.data
		.map(unwrapEntity)
		.filter((item): item is Record<string, unknown> => item !== null)
}

function readString(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null
	}
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

function readNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value
	}
	if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
		return Number(value.trim())
	}
	return null
}

function fileNameFromKey(key: string | null): string | null {
	if (!key) {
		return null
	}
	const parts = key.split('/').filter(Boolean)
	return parts[parts.length - 1] ?? null
}

function thumbnailUrl(media: unknown): string | null {
	const record = unwrapEntity(media)
	if (!record) {
		return null
	}
	const formats = asRecord(record.formats)
	const thumbnail = formats ? asRecord(formats.thumbnail) : null
	const small = formats ? asRecord(formats.small) : null
	return readString(thumbnail?.url)
		?? readString(small?.url)
		?? readString(record.url)
}

function mediaId(media: unknown): number | string | null {
	const record = unwrapEntity(media)
	if (!record) {
		return null
	}
	if (typeof record.id === 'number' || typeof record.id === 'string') {
		return record.id
	}
	return null
}

function photographerOf(
	value: unknown,
): TikPhotoboxCollection['photographer'] {
	const record = unwrapEntity(value)
	if (!record) {
		return null
	}
	const joinedName = [
		readString(record.firstName),
		readString(record.lastName),
	].filter((part): part is string => Boolean(part)).join(' ')
	const displayName = readString(record.DisplayName)
		?? (joinedName || readString(record.username))
	return {
		membershipNumber: readNumber(record.membershipNumber),
		displayName: displayName || null,
	}
}

function toPhoto(record: Record<string, unknown>): TikPhotoboxPhoto | null {
	const documentId = readString(record.documentId)
	if (!documentId) {
		return null
	}
	const storageKey = readString(record.S3Path)
	return {
		documentId,
		renderedPersons: readString(record.RenderedPersons),
		renderedDogs: readString(record.ReneredDogs),
		userMessage: readString(record.UserMessage),
		fileName: fileNameFromKey(storageKey),
		thumbnailUrl: thumbnailUrl(record.Thumbnail),
		createdAt: readString(record.createdAt),
		hasOriginal: Boolean(storageKey),
	}
}

function toCollection(
	record: Record<string, unknown>,
): TikPhotoboxCollection | null {
	const documentId = readString(record.documentId)
	if (!documentId) {
		return null
	}
	return {
		documentId,
		description: readString(record.CollectionDescription),
		location: readString(record.Location),
		createdAt: readString(record.createdAt),
		photographer: photographerOf(record.photogapher),
		photos: unwrapList(record.photos)
			.map(toPhoto)
			.filter((photo): photo is TikPhotoboxPhoto => photo !== null),
	}
}

export function clampPageSize(value: string | null): number {
	const parsed = Number(value)
	if (PAGE_SIZES.includes(parsed as (typeof PAGE_SIZES)[number])) {
		return parsed
	}
	return 10
}

async function collectionIdsForImageTerm(term: string): Promise<string[]> {
	const token = apiToken()
	const ids = new Set<string>()
	let page = 1
	let pageCount = 1

	while (page <= pageCount && page <= MAX_IMAGE_SCAN_PAGES) {
		const query = buildStrapiQuery({
			filters: {
				or: [
					{ RenderedPersons: { containsi: term } },
					{ ReneredDogs: { containsi: term } },
					{ UserMessage: { containsi: term } },
				],
			},
			pagination: { page, pageSize: IMAGE_SCAN_PAGE_SIZE },
			populate: {
				'populate[photobox_image_collection][fields][0]': 'documentId',
			},
		})
		const response = await fetchStrapiServer<unknown>(
			'photobox-images',
			query,
			{ token },
		)
		for (const item of extractStrapiList<Record<string, unknown>>(response)) {
			const collection = unwrapEntity(item.photobox_image_collection)
			const documentId = collection
				? readString(collection.documentId)
				: null
			if (documentId) {
				ids.add(documentId)
			}
		}
		pageCount = extractStrapiPagination(response)?.pageCount ?? page
		page += 1
	}

	return [...ids]
}

function photographerSearchClause(
	query: string,
): Record<string, unknown> | undefined {
	const trimmed = query.trim().replace(/\s+/g, ' ')
	if (!trimmed) {
		return undefined
	}

	if (/^\d+$/.test(trimmed)) {
		return {
			photogapher: {
				membershipNumber: { eq: Number(trimmed) },
			},
		}
	}

	const space = trimmed.indexOf(' ')
	if (space === -1) {
		return {
			or: [
				{ photogapher: { firstName: { containsi: trimmed } } },
				{ photogapher: { lastName: { containsi: trimmed } } },
			],
		}
	}

	const firstName = trimmed.slice(0, space)
	const lastName = trimmed.slice(space + 1)
	return {
		photogapher: {
			firstName: { containsi: firstName },
			lastName: { containsi: lastName },
		},
	}
}

function collectionFilters(
	photographerQuery: string | null,
	term: string | null,
	imageCollectionIds: string[],
): Record<string, unknown> | undefined {
	const clauses: Record<string, unknown>[] = []

	if (photographerQuery) {
		const photographerClause = photographerSearchClause(photographerQuery)
		if (photographerClause) {
			clauses.push(photographerClause)
		}
	}

	if (term) {
		const textMatch: Record<string, unknown>[] = [
			{ CollectionDescription: { containsi: term } },
			{ Location: { containsi: term } },
		]
		if (imageCollectionIds.length > 0) {
			textMatch.push({ documentId: { in: imageCollectionIds } })
		}
		clauses.push({ or: textMatch })
	}

	if (clauses.length === 0) {
		return undefined
	}
	if (clauses.length === 1) {
		return clauses[0]
	}
	return { and: clauses }
}

export async function searchTikPhotoboxCollections(
	input: TikPhotoboxSearchInput,
): Promise<TikPhotoboxSearchResult> {
	const token = apiToken()
	const imageCollectionIds = input.term
		? await collectionIdsForImageTerm(input.term)
		: []
	const query = buildStrapiQuery({
		filters: collectionFilters(
			input.photographerQuery,
			input.term,
			imageCollectionIds,
		),
		pagination: { page: input.page, pageSize: input.pageSize },
		sort: 'createdAt:desc',
		populate: COLLECTION_POPULATE,
	})
	const response = await fetchStrapiServer<unknown>(
		'photobox-image-collections',
		query,
		{ token },
	)
	const collections = extractStrapiList<Record<string, unknown>>(response)
		.map(toCollection)
		.filter((item): item is TikPhotoboxCollection => item !== null)
	const pagination = extractStrapiPagination(response)

	return {
		collections,
		pageInfo: {
			page: pagination?.page ?? input.page,
			pageSize: pagination?.pageSize ?? input.pageSize,
			pageCount: pagination?.pageCount ?? 1,
			total: pagination?.total ?? collections.length,
		},
	}
}

interface StoredPhoto {
	documentId: string
	storageKey: string | null
	mediaFileId: number | string | null
}

async function fetchAdmin(
	path: string,
	query?: URLSearchParams,
): Promise<unknown | null> {
	try {
		return await fetchStrapiServer<unknown>(path, query, {
			token: apiToken(),
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (/not found/i.test(message) || message.includes('404')) {
			return null
		}
		throw error
	}
}

async function loadStoredPhoto(documentId: string): Promise<StoredPhoto | null> {
	const query = new URLSearchParams({
		'populate[Thumbnail]': 'true',
	})
	const response = await fetchAdmin(`photobox-images/${documentId}`, query)
	if (!response) {
		return null
	}
	const record = extractStrapiSingle<Record<string, unknown>>(response)
		?? unwrapEntity(response)
	if (!record || readString(record.documentId) !== documentId) {
		return null
	}
	return {
		documentId,
		storageKey: readString(record.S3Path),
		mediaFileId: mediaId(record.Thumbnail),
	}
}

async function deleteMediaFile(fileId: number | string): Promise<void> {
	const response = await fetch(
		`${getStrapiPublicBaseUrl()}/api/upload/files/${fileId}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${apiToken()}`,
			},
		},
	)
	if (response.status === 404) {
		return
	}
	if (!response.ok) {
		throw new Error(
			`Mediendatei konnte nicht gelöscht werden (${response.status}).`,
		)
	}
}

async function deleteStoredPhoto(photo: StoredPhoto): Promise<string[]> {
	const warnings: string[] = []
	const token = apiToken()

	if (photo.storageKey) {
		if (!isPhotoboxWebDavConfigured()) {
			warnings.push(
				'WebDAV ist nicht konfiguriert, die Originaldatei blieb liegen.',
			)
		} else {
			try {
				await deletePhotoboxRawFile(photo.storageKey)
			} catch (error) {
				console.error('[TIK Photobox] WebDAV-Löschen fehlgeschlagen:', error)
				warnings.push('Die Originaldatei konnte nicht gelöscht werden.')
			}
		}
	}

	if (photo.mediaFileId !== null) {
		try {
			await deleteMediaFile(photo.mediaFileId)
		} catch (error) {
			console.error('[TIK Photobox] Thumbnail-Löschen fehlgeschlagen:', error)
			warnings.push('Das Vorschaubild konnte nicht gelöscht werden.')
		}
	}

	await deleteEntity('photobox-images', photo.documentId, {
		server: true,
		token,
	})
	return warnings
}

export async function deleteTikPhotoboxImage(
	documentId: string,
): Promise<{ warnings: string[] }> {
	const photo = await loadStoredPhoto(documentId)
	if (!photo) {
		throw new Error('Bild nicht gefunden.')
	}
	const warnings = await deleteStoredPhoto(photo)
	return { warnings }
}

export async function deleteTikPhotoboxCollection(
	documentId: string,
): Promise<{ warnings: string[] }> {
	const token = apiToken()
	const query = new URLSearchParams({
		'populate[photos][populate][Thumbnail]': 'true',
	})
	const response = await fetchAdmin(
		`photobox-image-collections/${documentId}`,
		query,
	)
	if (!response) {
		throw new Error('Sammlung nicht gefunden.')
	}
	const record = extractStrapiSingle<Record<string, unknown>>(response)
		?? unwrapEntity(response)
	if (!record || readString(record.documentId) !== documentId) {
		throw new Error('Sammlung nicht gefunden.')
	}

	const warnings: string[] = []
	for (const photoRecord of unwrapList(record.photos)) {
		const photoId = readString(photoRecord.documentId)
		if (!photoId) {
			continue
		}
		const photoWarnings = await deleteStoredPhoto({
			documentId: photoId,
			storageKey: readString(photoRecord.S3Path),
			mediaFileId: mediaId(photoRecord.Thumbnail),
		})
		warnings.push(...photoWarnings)
	}

	await deleteEntity('photobox-image-collections', documentId, {
		server: true,
		token,
	})
	return { warnings }
}

export async function readTikPhotoboxOriginal(
	documentId: string,
): Promise<TikPhotoboxFile | null> {
	const photo = await loadStoredPhoto(documentId)
	if (!photo?.storageKey) {
		return null
	}
	if (!isPhotoboxWebDavConfigured()) {
		throw new Error(
			'PhotoBox-Rohspeicher (OpenCloud WebDAV) ist nicht konfiguriert.',
		)
	}
	const buffer = await getPhotoboxRawFile(photo.storageKey)
	return {
		buffer,
		contentType: guessContentTypeFromKey(photo.storageKey),
		fileName: fileNameFromKey(photo.storageKey) ?? 'bild.jpg',
	}
}

export function contentDisposition(fileName: string): string {
	const ascii = fileName.replace(/[^\w.\-]+/g, '_') || 'bild.jpg'
	const encoded = encodeURIComponent(fileName)
	return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`
}

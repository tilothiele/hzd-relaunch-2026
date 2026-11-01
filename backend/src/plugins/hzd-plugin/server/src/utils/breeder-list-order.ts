import { createHash } from 'node:crypto'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from './document-pagination'

export type BreederListOrder = 'random' | 'zip'

const SEED_PATTERN = /^[A-Za-z0-9_-]{8,64}$/
const SCAN_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 100
const USER_UID = 'plugin::users-permissions.user'
const BREEDER_UID = 'plugin::hzd-plugin.breeder'

export interface BreederOrderRow {
	documentId: string
	zip: string
}

export interface OrderedBreederPage {
	ids: string[]
	page: number
	pageSize: number
	pageCount: number
	total: number
}

export function parseListOrder(value: unknown): BreederListOrder | null {
	const raw = Array.isArray(value) ? value[0] : value
	if (raw === 'random' || raw === 'zip') {
		return raw
	}
	return null
}

export function sanitizeListSeed(value: unknown): string {
	const raw = Array.isArray(value) ? value[0] : value
	if (typeof raw !== 'string') {
		return ''
	}
	const trimmed = raw.trim()
	return SEED_PATTERN.test(trimmed) ? trimmed : ''
}

export function normalizeZip(value: unknown): string {
	if (typeof value !== 'string') {
		return ''
	}
	return value.trim()
}

export function randomSortKey(documentId: string, seed: string): string {
	return createHash('sha256')
		.update(`${seed}\0${documentId}`)
		.digest('hex')
}

export function compareBreederOrder(
	order: BreederListOrder,
	seed: string,
	left: BreederOrderRow,
	right: BreederOrderRow,
): number {
	if (order === 'zip') {
		const byZip = compareZip(left.zip, right.zip)
		if (byZip !== 0) {
			return byZip
		}
	} else {
		const byRandom = randomSortKey(left.documentId, seed)
			.localeCompare(randomSortKey(right.documentId, seed))
		if (byRandom !== 0) {
			return byRandom
		}
	}

	return left.documentId.localeCompare(right.documentId)
}

export async function findOrderedBreederPage(
	strapi: Core.Strapi,
	options: {
		filters?: Record<string, unknown>
		order: BreederListOrder
		seed: string
		page: number
		pageSize: number
	},
): Promise<OrderedBreederPage> {
	const pageSize = Math.min(Math.max(options.pageSize, 1), MAX_PAGE_SIZE)
	const rows = await loadOrderRows(strapi, options.filters)
	rows.sort((left, right) => compareBreederOrder(
		options.order,
		options.seed,
		left,
		right,
	))

	const total = rows.length
	const pageCount = Math.max(1, Math.ceil(total / pageSize))
	const page = Math.max(options.page, 1)
	const start = (page - 1) * pageSize
	const ids = start >= total
		? []
		: rows.slice(start, start + pageSize).map((row) => row.documentId)

	return {
		ids,
		page,
		pageSize,
		pageCount,
		total,
	}
}

async function loadOrderRows(
	strapi: Core.Strapi,
	filters?: Record<string, unknown>,
): Promise<BreederOrderRow[]> {
	const rows: BreederOrderRow[] = []
	let page = 1
	let pageCount = 1

	do {
		const result = await findDocumentsPage<Record<string, unknown>>(
			strapi,
			BREEDER_UID,
			{
				filters,
				fields: ['documentId'],
				populate: {
					Address: {
						fields: ['Zip'],
					},
				},
				page,
				pageSize: SCAN_PAGE_SIZE,
			},
		)

		for (const breeder of result.results) {
			const documentId = typeof breeder.documentId === 'string'
				? breeder.documentId
				: ''
			if (!documentId) {
				continue
			}
			rows.push({
				documentId,
				zip: normalizeZip(readAddressZip(breeder.Address)),
			})
		}

		pageCount = result.pagination.pageCount
		page += 1
	} while (page <= pageCount && page <= 100)

	const memberZips = await loadPublishedMemberZips(
		strapi,
		rows.map((row) => row.documentId),
	)
	for (const row of rows) {
		const memberZip = memberZips.get(row.documentId)
		if (memberZip) {
			row.zip = memberZip
		}
	}

	return rows
}

async function loadPublishedMemberZips(
	strapi: Core.Strapi,
	documentIds: string[],
): Promise<Map<string, string>> {
	const zipByBreeder = new Map<string, string>()
	if (documentIds.length === 0) {
		return zipByBreeder
	}

	const candidates: Array<{
		breederDocumentId: string
		userId: number
		zip: string
	}> = []
	const chunkSize = 100

	for (let index = 0; index < documentIds.length; index += chunkSize) {
		const chunk = documentIds.slice(index, index + chunkSize)
		const users = await strapi.db.query(USER_UID).findMany({
			where: {
				breeders: {
					documentId: { $in: chunk },
				},
			},
			select: ['id', 'zip', 'publishMyData'],
			populate: {
				breeders: {
					select: ['documentId'],
				},
			},
		}) as Array<Record<string, unknown>>

		for (const user of users) {
			if (user.publishMyData !== true) {
				continue
			}
			const zip = normalizeZip(user.zip)
			const userId = typeof user.id === 'number' ? user.id : 0
			if (!zip || userId <= 0) {
				continue
			}
			const breeders = Array.isArray(user.breeders) ? user.breeders : []
			for (const breeder of breeders) {
				if (!breeder || typeof breeder !== 'object') {
					continue
				}
				const breederDocumentId = (breeder as { documentId?: unknown }).documentId
				if (typeof breederDocumentId !== 'string') {
					continue
				}
				candidates.push({
					breederDocumentId,
					userId,
					zip,
				})
			}
		}
	}

	candidates.sort((left, right) => left.userId - right.userId)
	for (const candidate of candidates) {
		if (!zipByBreeder.has(candidate.breederDocumentId)) {
			zipByBreeder.set(candidate.breederDocumentId, candidate.zip)
		}
	}

	return zipByBreeder
}

function compareZip(left: string, right: string): number {
	if (!left && !right) {
		return 0
	}
	if (!left) {
		return 1
	}
	if (!right) {
		return -1
	}

	return left.localeCompare(right, 'de')
}

function readAddressZip(address: unknown): unknown {
	if (!address || typeof address !== 'object') {
		return null
	}
	return (address as { Zip?: unknown }).Zip
}

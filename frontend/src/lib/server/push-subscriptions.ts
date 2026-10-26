import { buildStrapiQuery } from '@/lib/strapi/filters'
import {
	createEntity,
	deleteEntity,
	fetchEntityList,
	updateEntity,
	type StrapiRequestOptions,
} from '@/lib/strapi/api'

export interface PushSubscriptionRecord {
	documentId: string
	endpoint: string
	p256dh?: string | null
	auth?: string | null
	channels?: unknown
}

const COLLECTION = 'subscriptions'
const PAGE_SIZE = 100

function publishedQuery(): URLSearchParams {
	return new URLSearchParams({ status: 'published' })
}

export function withPublishedStatus(options: StrapiRequestOptions): StrapiRequestOptions {
	return { ...options, query: publishedQuery() }
}

export function readChannels(value: unknown): Record<string, boolean> {
	let parsed = value
	if (typeof parsed === 'string') {
		try {
			parsed = JSON.parse(parsed)
		} catch {
			return {}
		}
	}

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		return {}
	}

	const channels: Record<string, boolean> = {}
	for (const [key, enabled] of Object.entries(parsed as Record<string, unknown>)) {
		channels[key] = enabled === true || enabled === 'true' || enabled === 1 || enabled === '1'
	}
	return channels
}

async function fetchByStatus(
	status: 'published' | 'draft',
	options: StrapiRequestOptions,
	filters?: Record<string, unknown>,
): Promise<PushSubscriptionRecord[]> {
	const all: PushSubscriptionRecord[] = []

	for (let page = 1; page <= 20; page += 1) {
		const query = buildStrapiQuery({
			filters,
			pagination: { page, pageSize: PAGE_SIZE },
			status,
		})
		const batch = await fetchEntityList<PushSubscriptionRecord>(COLLECTION, query, options)
		all.push(...batch)
		if (batch.length < PAGE_SIZE) break
	}

	return all
}

function mergeSubscription(current: PushSubscriptionRecord | undefined, next: PushSubscriptionRecord) {
	if (!current) return next

	const channels = readChannels(current.channels)
	for (const [key, enabled] of Object.entries(readChannels(next.channels))) {
		if (enabled) channels[key] = true
	}

	const currentHasKeys = Boolean(current.p256dh && current.auth)
	return {
		documentId: current.documentId || next.documentId,
		endpoint: current.endpoint || next.endpoint,
		p256dh: currentHasKeys ? current.p256dh : next.p256dh,
		auth: currentHasKeys ? current.auth : next.auth,
		channels,
	}
}

export async function listPushSubscriptions(options: StrapiRequestOptions): Promise<PushSubscriptionRecord[]> {
	const [published, drafts] = await Promise.all([
		fetchByStatus('published', options),
		fetchByStatus('draft', options).catch(() => [] as PushSubscriptionRecord[]),
	])

	const byEndpoint = new Map<string, PushSubscriptionRecord>()
	for (const subscription of [...published, ...drafts]) {
		if (!subscription.endpoint) continue
		byEndpoint.set(
			subscription.endpoint,
			mergeSubscription(byEndpoint.get(subscription.endpoint), subscription),
		)
	}

	return [...byEndpoint.values()]
}

export async function findPushSubscriptionsByEndpoint(
	endpoint: string,
	options: StrapiRequestOptions,
): Promise<PushSubscriptionRecord[]> {
	const filters = { endpoint: { eq: endpoint } }
	const [published, drafts] = await Promise.all([
		fetchByStatus('published', options, filters),
		fetchByStatus('draft', options, filters).catch(() => [] as PushSubscriptionRecord[]),
	])

	const byDocument = new Map<string, PushSubscriptionRecord>()
	for (const subscription of [...published, ...drafts]) {
		byDocument.set(
			subscription.documentId,
			mergeSubscription(byDocument.get(subscription.documentId), subscription),
		)
	}
	return [...byDocument.values()]
}

export async function savePushSubscription(
	data: Record<string, unknown>,
	existing: PushSubscriptionRecord | null,
	options: StrapiRequestOptions,
) {
	const writeOptions = withPublishedStatus(options)
	if (existing) {
		return updateEntity(COLLECTION, existing.documentId, data, writeOptions)
	}
	return createEntity(COLLECTION, data, writeOptions)
}

export async function deletePushSubscriptions(
	subscriptions: PushSubscriptionRecord[],
	options: StrapiRequestOptions,
) {
	const writeOptions = withPublishedStatus(options)
	const documentIds = [...new Set(subscriptions.map((subscription) => subscription.documentId))]
	await Promise.all(documentIds.map((documentId) => deleteEntity(COLLECTION, documentId, writeOptions)))
}

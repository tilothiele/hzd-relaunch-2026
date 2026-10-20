import { Meilisearch } from 'meilisearch'
import { readRuntimeEnv } from './runtime-env'
import { isSiteSearchConfigured } from './search-config'

export const SEARCH_PAGE_SIZE = 10

export interface SearchHit {
	id: string
	type: string
	typeLabel: string
	title: string
	excerpt: string
	url: string
}

export interface SiteSearchResult {
	hits: SearchHit[]
	query: string
	page: number
	pageSize: number
	total: number
	configured: boolean
	error: string | null
}

function meiliHost(): string | null {
	return readRuntimeEnv('MEILI_HOST') ?? null
}

function meiliApiKey(): string | undefined {
	const key = process.env.MEILI_API_KEY || process.env.MEILI_MASTER_KEY
	return key?.trim() ? key.trim() : undefined
}

function emptyResult(query: string, page: number, configured: boolean, error: string | null): SiteSearchResult {
	return {
		hits: [],
		query,
		page,
		pageSize: SEARCH_PAGE_SIZE,
		total: 0,
		configured,
		error,
	}
}

export async function searchSite(query: string, page: number): Promise<SiteSearchResult> {
	const trimmed = query.trim()
	const safePage = Number.isFinite(page) && page > 0 ? page : 1
	const host = meiliHost()
	const configured = isSiteSearchConfigured()

	if (!trimmed) {
		return emptyResult('', safePage, configured, null)
	}

	if (!host) {
		return emptyResult(trimmed, safePage, false, 'Die Suche ist nicht konfiguriert.')
	}

	try {
		const client = new Meilisearch({
			host,
			apiKey: meiliApiKey(),
		})
		const response = await client.index('hzd_content').search(trimmed, {
			limit: SEARCH_PAGE_SIZE,
			offset: (safePage - 1) * SEARCH_PAGE_SIZE,
			attributesToRetrieve: ['id', 'type', 'typeLabel', 'title', 'excerpt', 'url'],
		})

		const hits = (response.hits ?? []).map((hit) => {
			const entry = hit as Partial<SearchHit>
			return {
				id: String(entry.id ?? ''),
				type: String(entry.type ?? ''),
				typeLabel: String(entry.typeLabel ?? 'Treffer'),
				title: String(entry.title ?? ''),
				excerpt: String(entry.excerpt ?? ''),
				url: String(entry.url ?? '/'),
			}
		}).filter((hit) => hit.id && hit.url.startsWith('/'))

		return {
			hits,
			query: trimmed,
			page: safePage,
			pageSize: SEARCH_PAGE_SIZE,
			total: response.estimatedTotalHits ?? hits.length,
			configured: true,
			error: null,
		}
	} catch (error) {
		console.error('[Search] Meilisearch-Abfrage fehlgeschlagen', error)
		return emptyResult(trimmed, safePage, true, 'Die Suche ist gerade nicht erreichbar.')
	}
}

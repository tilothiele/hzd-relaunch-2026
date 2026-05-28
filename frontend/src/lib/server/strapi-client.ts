import {
	StrapiUnauthorizedError,
	isUnauthorizedMessage,
} from '@/lib/strapi-errors'

export function getStrapiBaseUrl(): string {
	const serverUrl = process.env.STRAPI_BASE_URL

	if (serverUrl) {
		return serverUrl.trim().replace(/\/$/, '')
	}

	throw new Error(
		'Strapi Base URL ist nicht gesetzt. Bitte STRAPI_BASE_URL in der Umgebungsvariable setzen.',
	)
}

export function getStrapiPublicBaseUrl(): string {
	return (
		process.env.STRAPI_BASE_URL
		|| process.env.NEXT_PUBLIC_STRAPI_BASE_URL
		|| 'http://localhost:1337'
	).replace(/\/$/, '')
}

interface StrapiErrorPayload {
	error?: {
		message?: string
		status?: number
	}
}

export interface FetchStrapiServerOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
	token?: string | null
	body?: unknown
	publicationState?: 'live' | 'preview'
	cache?: RequestCache
}

function buildApiUrl(path: string, query?: URLSearchParams): string {
	const baseUrl = getStrapiBaseUrl()
	const normalizedPath = path.replace(/^\//, '')
	const queryString = query?.toString()
	return queryString
		? `${baseUrl}/api/${normalizedPath}?${queryString}`
		: `${baseUrl}/api/${normalizedPath}`
}

export async function fetchStrapiServer<T>(
	path: string,
	query?: URLSearchParams,
	options: FetchStrapiServerOptions = {},
): Promise<T> {
	const url = buildApiUrl(path, query)
	const headers: Record<string, string> = {
		Accept: 'application/json',
	}

	if (options.body !== undefined) {
		headers['Content-Type'] = 'application/json'
	}

	if (options.token) {
		headers.Authorization = `Bearer ${options.token}`
	}

	const response = await fetch(url, {
		method: options.method ?? 'GET',
		headers,
		body: options.body !== undefined
			? JSON.stringify(options.body)
			: undefined,
		cache: options.cache ?? 'no-store',
	})

	const payload = await response.json().catch(() => null) as T & StrapiErrorPayload

	if (!response.ok) {
		const message = payload?.error?.message
			?? `Strapi-Anfrage fehlgeschlagen (${response.status})`

		if (response.status === 401 || response.status === 403 || isUnauthorizedMessage(message)) {
			throw new StrapiUnauthorizedError(message)
		}

		throw new Error(message)
	}

	return payload
}

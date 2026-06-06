import {
	StrapiUnauthorizedError,
	isStrapiUnauthorizedError,
	isUnauthorizedMessage,
} from '@/lib/strapi-errors'

let persistedAuthToken: string | null = null
let unauthorizedHandler: (() => void) | null = null
let isHandlingUnauthorized = false

export function setStrapiUnauthorizedHandler(handler: (() => void) | null) {
	unauthorizedHandler = handler
}

/** @deprecated Use setStrapiUnauthorizedHandler */
export const setGraphQLUnauthorizedHandler = setStrapiUnauthorizedHandler

function notifyUnauthorized() {
	if (isHandlingUnauthorized || !unauthorizedHandler) {
		return
	}

	isHandlingUnauthorized = true
	unauthorizedHandler()

	window.setTimeout(() => {
		isHandlingUnauthorized = false
	}, 5000)
}

export function setStrapiAuthToken(token?: string | null) {
	persistedAuthToken = token ?? null
}

/** @deprecated Use setStrapiAuthToken */
export const setGraphQLAuthToken = setStrapiAuthToken

interface FetchStrapiOptions {
	token?: string | null
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
	body?: unknown
}

function buildProxyPath(path: string): string {
	const normalizedPath = path.replace(/^\//, '').replace(/^api\//, '')
	return `/api/strapi/${normalizedPath}`
}

export async function fetchStrapi<T>(
	path: string,
	query?: URLSearchParams,
	options: FetchStrapiOptions = {},
): Promise<T> {
	const effectiveToken = options.token ?? persistedAuthToken
	const proxyPath = buildProxyPath(path)
	const queryString = query?.toString()
	const url = queryString ? `${proxyPath}?${queryString}` : proxyPath

	const headers: Record<string, string> = {
		Accept: 'application/json',
	}

	if (effectiveToken) {
		headers.Authorization = `Bearer ${effectiveToken}`
	}

	if (options.body !== undefined) {
		headers['Content-Type'] = 'application/json'
	}

	try {
		const response = await fetch(url, {
			method: options.method ?? 'GET',
			credentials: 'include',
			headers,
			body: options.body !== undefined
				? JSON.stringify({ body: options.body })
				: undefined,
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => null) as {
				error?: { message?: string }
			} | null
			const errorMessage = errorData?.error?.message
				?? 'Strapi-Anfrage fehlgeschlagen'

			if (response.status === 401 || isUnauthorizedMessage(errorMessage)) {
				notifyUnauthorized()
				throw new StrapiUnauthorizedError(errorMessage)
			}

			throw new Error(errorMessage)
		}

		return await response.json() as T
	} catch (error) {
		if (isStrapiUnauthorizedError(error)) {
			notifyUnauthorized()
			throw error instanceof StrapiUnauthorizedError
				? error
				: new StrapiUnauthorizedError(
					error instanceof Error ? error.message : 'Nicht authentifiziert',
				)
		}

		if (error instanceof Error) {
			throw error
		}

		throw new Error('Strapi-Anfrage fehlgeschlagen')
	}
}

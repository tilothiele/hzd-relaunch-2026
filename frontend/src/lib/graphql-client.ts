import { GraphQLClient } from 'graphql-request'

let persistedAuthToken: string | null = null
let persistedBaseUrl: string | null = null

/**
 * Initialisiert den Token aus localStorage (falls vorhanden)
 * Sollte beim App-Start aufgerufen werden
 */
function initializeTokenFromStorage() {
	if (typeof window === 'undefined') {
		return
	}

	try {
		const stored = localStorage.getItem('hzd_auth_state')
		if (stored) {
			const parsed = JSON.parse(stored) as { token?: string | null }
			if (parsed.token && typeof parsed.token === 'string') {
				persistedAuthToken = parsed.token
				return
			}
		}
	} catch {
		// Ignore parse errors
	}
}

// Initialisiere beim Modul-Laden (nur im Browser)
if (typeof window !== 'undefined') {
	initializeTokenFromStorage()
}

export function setGraphQLAuthToken(token?: string | null) {
	persistedAuthToken = token ?? null
}

export function setGraphQLBaseUrl(baseUrl?: string | null) {
	if (typeof baseUrl === 'string' && baseUrl.trim().length > 0) {
		persistedBaseUrl = baseUrl.trim()
	} else {
		persistedBaseUrl = null
	}
}

interface FetchGraphQLOptions {
	variables?: Record<string, unknown>
	token?: string | null
	baseUrl?: string | null
}

export async function fetchGraphQL<T>(
	query: string,
	options: FetchGraphQLOptions = {},
): Promise<T> {
	const { variables, token } = options

	// Versuche Token aus verschiedenen Quellen zu holen
	let effectiveToken = token ?? persistedAuthToken

	// Fallback: Versuche Token aus localStorage zu holen, falls noch nicht gesetzt
	if (!effectiveToken && typeof window !== 'undefined') {
		try {
			const stored = localStorage.getItem('hzd_auth_state')
			if (stored) {
				const parsed = JSON.parse(stored) as { token?: string | null | unknown; user?: unknown }

				// Normalisiere Token: Falls es ein Objekt ist, versuche token.token oder token.jwt
				let normalizedToken: string | null = null
				if (typeof parsed.token === 'string' && parsed.token.length > 0) {
					normalizedToken = parsed.token
				} else if (parsed.token && typeof parsed.token === 'object') {
					const tokenObj = parsed.token as Record<string, unknown>
					if (typeof tokenObj.token === 'string') {
						normalizedToken = tokenObj.token
					} else if (typeof tokenObj.jwt === 'string') {
						normalizedToken = tokenObj.jwt
					} else if (typeof tokenObj.Token === 'string') {
						normalizedToken = tokenObj.Token
					}
				}

				if (normalizedToken) {
					effectiveToken = normalizedToken
					persistedAuthToken = normalizedToken
				}
			}
		} catch (error) {
			console.error('[GraphQL Client] Fehler beim Laden aus localStorage:', error)
		}
	}

	// Verwende Next.js API-Route als Proxy, um CORS-Probleme zu vermeiden
	try {
		const response = await fetch('/api/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query,
				variables,
				token: effectiveToken,
			}),
		})

		if (!response.ok) {
			const errorData = await response.json().catch(() => null)
			const errorMessage = errorData?.error?.message ?? 'GraphQL-Anfrage fehlgeschlagen'
			throw new Error(errorMessage)
		}

		const data = (await response.json()) as T
		return data
	} catch (error) {
		console.error('GraphQL Error:', error)
		if (error instanceof Error) {
			throw error
		}
		throw new Error('GraphQL-Anfrage fehlgeschlagen')
	}
}

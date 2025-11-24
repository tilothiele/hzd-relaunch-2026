import { GraphQLClient } from 'graphql-request'

let persistedAuthToken: string | null = null
let persistedBaseUrl: string | null = null

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

	const effectiveToken = token ?? persistedAuthToken

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
			console.error('Error message:', error.message)
			throw error
		}
		throw new Error('GraphQL-Anfrage fehlgeschlagen')
	}
}

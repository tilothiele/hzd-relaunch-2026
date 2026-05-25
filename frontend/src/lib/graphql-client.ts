import {
	GraphQLUnauthorizedError,
	isGraphQLUnauthorizedError,
	isUnauthorizedMessage,
} from '@/lib/graphql-errors'

let persistedAuthToken: string | null = null
let persistedBaseUrl: string | null = null
let unauthorizedHandler: (() => void) | null = null
let isHandlingUnauthorized = false

export function setGraphQLUnauthorizedHandler(handler: (() => void) | null) {
	unauthorizedHandler = handler
}

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

	// Verwende Next.js API-Route als Proxy, um CORS-Probleme zu vermeiden.
	// credentials: 'include' damit HTTP-Basic (falls Next geschützt ist) mitgeht;
	// Strapi erhält weiter nur den OIDC-Token über den Proxy-Body, keine Basic-Header.
	try {
		const response = await fetch('/api/graphql', {
			method: 'POST',
			credentials: 'include',
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
			console.error('GraphQL Error:', errorMessage)
			console.error('GraphQL Error Data:', errorData)

			if (response.status === 401 || isUnauthorizedMessage(errorMessage)) {
				notifyUnauthorized()
				throw new GraphQLUnauthorizedError(errorMessage)
			}

			throw new Error(errorMessage)
		}

		const data = (await response.json()) as T & {
			errors?: Array<{ message?: string }>
		}

		const graphQLErrorMessage = data.errors?.[0]?.message
		if (graphQLErrorMessage && isUnauthorizedMessage(graphQLErrorMessage)) {
			notifyUnauthorized()
			throw new GraphQLUnauthorizedError(graphQLErrorMessage)
		}

		return data
	} catch (error) {
		console.error('GraphQL Error:', error)

		if (isGraphQLUnauthorizedError(error)) {
			notifyUnauthorized()
			throw error instanceof GraphQLUnauthorizedError
				? error
				: new GraphQLUnauthorizedError(
					error instanceof Error ? error.message : 'Nicht authentifiziert',
				)
		}

		if (error instanceof Error) {
			throw error
		}

		throw new Error('GraphQL-Anfrage fehlgeschlagen')
	}
}

import { GraphQLClient } from 'graphql-request'

/**
 * Ruft die Strapi Base URL aus Umgebungsvariablen ab.
 * Für Server Components sollte STRAPI_BASE_URL gesetzt sein.
 * Falls nicht verfügbar, wird NEXT_PUBLIC_STRAPI_BASE_URL verwendet.
 */
export function getStrapiBaseUrl(): string {
	const serverUrl = process.env.STRAPI_BASE_URL

	if (serverUrl) {
		return serverUrl.trim()
	}

	throw new Error(
		'Strapi Base URL ist nicht gesetzt. Bitte STRAPI_BASE_URL in der Umgebungsvariable setzen.',
	)
}

interface ServerFetchGraphQLOptions {
	variables?: Record<string, unknown>
	token?: string | null
	baseUrl?: string | null
}

/**
 * Serverseitige Variante von fetchGraphQL.
 * Verwendet keine persistierten Zustände und ist für Server Components optimiert.
 *
 * @param query - GraphQL Query String
 * @param options - Optionale Parameter (variables, token, baseUrl)
 * @returns Promise mit den abgerufenen Daten
 */
export async function fetchGraphQLServer<T>(
	query: string,
	options: ServerFetchGraphQLOptions = {},
): Promise<T> {
	const { variables, token, baseUrl } = options

	// Verwende baseUrl aus Optionen, falls vorhanden, sonst aus Umgebungsvariablen
	const resolvedBaseUrl = baseUrl ?? getStrapiBaseUrl()

	if (!resolvedBaseUrl || resolvedBaseUrl.trim().length === 0) {
		throw new Error('Strapi Base URL ist nicht gesetzt.')
	}

	const effectiveBaseUrl = resolvedBaseUrl.replace(/\/$/, '')
	const endpoint = `${effectiveBaseUrl}/graphql`
	const client = new GraphQLClient(endpoint)

	if (token) {
		client.setHeader('Authorization', `Bearer ${token}`)
	}

	try {
		const data = await client.request<T>(query, variables)
		//console.log('GraphQL Data:', query, variables, data)
		return data
	} catch (error) {
		console.error('GraphQL Error:', error)
		if (error instanceof Error) {
			console.error('Error message:', error.message)
		}
		throw error
	}
}


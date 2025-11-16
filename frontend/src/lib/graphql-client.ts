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
	const { variables, token, baseUrl } = options

	const effectiveToken = token ?? persistedAuthToken
	const resolvedBaseUrl = baseUrl ?? persistedBaseUrl

	if (!resolvedBaseUrl || resolvedBaseUrl.trim().length === 0) {
		throw new Error('Strapi Base URL ist nicht gesetzt. Bitte Konfiguration laden.')
	}

	const effectiveBaseUrl = resolvedBaseUrl.replace(/\/$/, '')
	const endpoint = `${effectiveBaseUrl}/graphql`
	const client = new GraphQLClient(endpoint)

	if (effectiveToken) {
		client.setHeader('Authorization', `Bearer ${effectiveToken}`)
	}

	console.log(query, variables)

	try {
		const data = await client.request<T>(query, variables)
		return data
	} catch (error) {
		console.error('GraphQL Error:', error)
		if (error instanceof Error) {
			console.error('Error message:', error.message)
		}
		throw error
	}
}

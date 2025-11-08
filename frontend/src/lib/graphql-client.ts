import { GraphQLClient } from 'graphql-request'

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
const graphqlEndpoint = `${strapiUrl}/graphql`

export const graphqlClient = new GraphQLClient(graphqlEndpoint)

let persistedAuthToken: string | null = null

export function setGraphQLAuthToken(token?: string | null) {
	persistedAuthToken = token ?? null
}

export async function fetchGraphQL<T>(
	query: string,
	variables?: Record<string, unknown>,
	token?: string | null,
): Promise<T> {
	try {
		const effectiveToken = token ?? persistedAuthToken
		const headers = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : undefined
		const data = await graphqlClient.request<T>(query, variables, headers)
		return data
	} catch (error) {
		console.error('GraphQL Error:', error)
		if (error instanceof Error) {
			console.error('Error message:', error.message)
		}
		throw error
	}
}

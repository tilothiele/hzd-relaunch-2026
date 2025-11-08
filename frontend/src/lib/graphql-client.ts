import { GraphQLClient } from 'graphql-request'

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
const graphqlEndpoint = `${strapiUrl}/graphql`

export const graphqlClient = new GraphQLClient(graphqlEndpoint)

export async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
	try {
		const data = await graphqlClient.request<T>(query, variables)
		console.log(data)
		return data
	} catch (error) {
		console.error('GraphQL Error:', error)
		if (error instanceof Error) {
			console.error('Error message:', error.message)
		}
		throw error
	}
}



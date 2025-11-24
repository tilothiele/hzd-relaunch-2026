import { NextRequest, NextResponse } from 'next/server'
import { GraphQLClient } from 'graphql-request'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'

/**
 * Proxy-Route für GraphQL-Anfragen.
 * Umgeht CORS-Probleme, indem die Anfrage serverseitig weitergeleitet wird.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { query, variables, token } = body

		if (!query) {
			return NextResponse.json(
				{ error: 'GraphQL query is required' },
				{ status: 400 },
			)
		}

		const effectiveBaseUrl = strapiBaseUrl.replace(/\/$/, '')
		const endpoint = `${effectiveBaseUrl}/graphql`
		const client = new GraphQLClient(endpoint)

		if (token) {
			client.setHeader('Authorization', `Bearer ${token}`)
		}

		const data = await client.request(query, variables)

		return NextResponse.json(data)
	} catch (error) {
		console.error('GraphQL proxy error:', error)
		
		if (error instanceof Error) {
			return NextResponse.json(
				{ error: { message: error.message } },
				{ status: 500 },
			)
		}

		return NextResponse.json(
			{ error: { message: 'GraphQL-Anfrage fehlgeschlagen' } },
			{ status: 500 },
		)
	}
}


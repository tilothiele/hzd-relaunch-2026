import { NextRequest, NextResponse } from 'next/server'
import { GraphQLClient } from 'graphql-request'
import { draftMode } from 'next/headers'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function getStrapiBaseUrl(): string {
	const raw =
		process.env.STRAPI_BASE_URL
		|| process.env.NEXT_PUBLIC_STRAPI_BASE_URL
		|| 'http://localhost:1337'
	return raw.replace(/\/$/, '')
}

/** Kein Next.js Data Cache für ausgehende Strapi-GraphQL-Requests */
function fetchNoStore(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> {
	return fetch(input, {
		...init,
		cache: 'no-store',
	})
}

/**
 * Proxy-Route für GraphQL-Anfragen.
 * Umgeht CORS-Probleme, indem die Anfrage serverseitig weitergeleitet wird.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { query, variables, token } = body

		const isDraft = (await draftMode()).isEnabled
		const effectiveVariables = isDraft
			? { ...variables, publicationState: 'PREVIEW' }
			: variables

		if (!query) {
			return NextResponse.json(
				{ error: 'GraphQL query is required' },
				{ status: 400 },
			)
		}

		const endpoint = `${getStrapiBaseUrl()}/graphql`
		const client = new GraphQLClient(endpoint, {
			fetch: fetchNoStore,
		})

		if (token && typeof token === 'string' && token.length > 0) {
			client.setHeader('Authorization', `Bearer ${token}`)
		}

		const data = await client.request(query, effectiveVariables)

		return NextResponse.json(data, {
			headers: {
				'Cache-Control': 'no-store, must-revalidate',
			},
		})
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



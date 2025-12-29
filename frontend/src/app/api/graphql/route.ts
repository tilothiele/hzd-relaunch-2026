import { NextRequest, NextResponse } from 'next/server'
import { GraphQLClient } from 'graphql-request'
import { draftMode } from 'next/headers'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_STRAPI_BASE_URL || 'http://localhost:1337'

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

		// console.log('[GraphQL Proxy] Request Body:', {
		// 	'has query': !!query,
		// 	'query length': query?.length ?? 0,
		// 	'has variables': !!variables,
		// 	'has token': !!token,
		// 	'token type': typeof token,
		// 	'token length': token?.length ?? 0,
		// 	'token preview': token ? (typeof token === 'string' ? token.substring(0, 30) + '...' : String(token)) : null,
		// })

		if (!query) {
			return NextResponse.json(
				{ error: 'GraphQL query is required' },
				{ status: 400 },
			)
		}

		const effectiveBaseUrl = strapiBaseUrl.replace(/\/$/, '')
		const endpoint = `${effectiveBaseUrl}/graphql`
		const client = new GraphQLClient(endpoint)

		if (token && typeof token === 'string' && token.length > 0) {
			client.setHeader('Authorization', `Bearer ${token}`)
			//console.log('[GraphQL Proxy] Token wird übergeben:', token.substring(0, 30) + '...')
		} else {
			// console.log('[GraphQL Proxy] Token-Daten:', {
			// 	'token': token,
			// 	'type': typeof token,
			// 	'is string': typeof token === 'string',
			// 	'length': token?.length ?? 0,
			// })
			// console.warn('[GraphQL Proxy] Kein gültiger Token gefunden. Typ:', typeof token)
		}

		const data = await client.request(query, effectiveVariables)

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



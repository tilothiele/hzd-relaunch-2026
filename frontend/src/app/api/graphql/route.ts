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

		// Debug: Logge die Query
		if (query.includes('GetMe') || query.includes('me')) {
			console.log('[GraphQL Proxy] Query:', query.substring(0, 200))
		}

		const effectiveBaseUrl = strapiBaseUrl.replace(/\/$/, '')
		const endpoint = `${effectiveBaseUrl}/graphql`
		const client = new GraphQLClient(endpoint)

		// Normalisiere Token: Falls es ein Objekt ist, versuche token.token oder token.jwt
		let effectiveToken: string | null = null
		if (typeof token === 'string' && token.length > 0) {
			effectiveToken = token
		} else if (token && typeof token === 'object') {
			// Versuche verschiedene mögliche Eigenschaften
			if ('token' in token && typeof token.token === 'string') {
				effectiveToken = token.token
			} else if ('jwt' in token && typeof token.jwt === 'string') {
				effectiveToken = token.jwt
			} else if ('Token' in token && typeof token.Token === 'string') {
				effectiveToken = token.Token
			}
		}

		if (effectiveToken) {
			client.setHeader('Authorization', `Bearer ${effectiveToken}`)
			console.log('[GraphQL Proxy] Token wird übergeben:', effectiveToken.substring(0, 20) + '...')
		} else {
			console.log('[GraphQL Proxy] Token-Daten:', token)
			console.warn('[GraphQL Proxy] Kein gültiger Token gefunden. Typ:', typeof token)
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



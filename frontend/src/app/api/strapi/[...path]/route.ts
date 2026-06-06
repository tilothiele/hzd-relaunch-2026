import { NextRequest, NextResponse } from 'next/server'
import { draftMode } from 'next/headers'
import { getToken } from 'next-auth/jwt'
import {
	resolveStrapiErrorStatus,
} from '@/lib/strapi-errors'
import { getStrapiPublicBaseUrl } from '@/lib/server/strapi-client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function fetchNoStore(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> {
	return fetch(input, {
		...init,
		cache: 'no-store',
	})
}

async function forwardToStrapi(
	request: NextRequest,
	pathSegments: string[],
) {
	const isDraft = (await draftMode()).isEnabled
	const incomingUrl = new URL(request.url)
	const strapiBaseUrl = getStrapiPublicBaseUrl().replace(/\/$/, '')

	const forwardParams = new URLSearchParams(incomingUrl.searchParams)

	if (isDraft) {
		forwardParams.set('publicationState', 'preview')
	}

	const apiPath = pathSegments.join('/')
	const targetUrl = forwardParams.toString()
		? `${strapiBaseUrl}/api/${apiPath}?${forwardParams.toString()}`
		: `${strapiBaseUrl}/api/${apiPath}`

	const sessionToken = await getToken({
		req: request,
		secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
	})

	const headerAuth = request.headers.get('authorization')
	const headerToken = headerAuth?.startsWith('Bearer ')
		? headerAuth.slice('Bearer '.length)
		: undefined

	let requestBody: unknown

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		try {
			const json = await request.json() as {
				body?: unknown
			}
			requestBody = json.body
		} catch {
			requestBody = undefined
		}
	}

	const effectiveToken = headerToken
		?? sessionToken?.idToken
		?? sessionToken?.accessToken
	const headers: Record<string, string> = {
		Accept: 'application/json',
	}

	if (requestBody !== undefined) {
		headers['Content-Type'] = 'application/json'
	}

	if (typeof effectiveToken === 'string' && effectiveToken.length > 0) {
		headers.Authorization = `Bearer ${effectiveToken}`
	}

	const response = await fetchNoStore(targetUrl, {
		method: request.method,
		headers,
		body: requestBody !== undefined
			? JSON.stringify(requestBody)
			: undefined,
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok) {
		const message = payload?.error?.message
			?? `Strapi-Anfrage fehlgeschlagen (${response.status})`

		return NextResponse.json(
			{ error: { message } },
			{ status: resolveStrapiErrorStatus({ message }) === 401 ? 401 : response.status },
		)
	}

	return NextResponse.json(payload, {
		headers: {
			'Cache-Control': 'no-store, must-revalidate',
		},
	})
}

type RouteContext = {
	params: Promise<{ path: string[] }>
}

export async function GET(request: NextRequest, context: RouteContext) {
	const { path } = await context.params
	return forwardToStrapi(request, path)
}

export async function POST(request: NextRequest, context: RouteContext) {
	const { path } = await context.params
	return forwardToStrapi(request, path)
}

export async function PUT(request: NextRequest, context: RouteContext) {
	const { path } = await context.params
	return forwardToStrapi(request, path)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
	const { path } = await context.params
	return forwardToStrapi(request, path)
}

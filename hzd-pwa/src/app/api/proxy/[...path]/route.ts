import { NextRequest, NextResponse } from 'next/server'
import { getStrapiJwtFromRequest } from '@/lib/auth-cookie'
import { getStrapiBaseUrl } from '@/lib/strapi-api'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

async function forwardToStrapi(
	request: NextRequest,
	pathSegments: string[],
) {
	const incomingUrl = new URL(request.url)
	const strapiBaseUrl = getStrapiBaseUrl()
	const forwardParams = new URLSearchParams(incomingUrl.searchParams)
	const apiPath = pathSegments.join('/')
	const targetUrl = forwardParams.toString()
		? `${strapiBaseUrl}/api/${apiPath}?${forwardParams.toString()}`
		: `${strapiBaseUrl}/api/${apiPath}`

	const headerAuth = request.headers.get('authorization')
	const headerToken = headerAuth?.startsWith('Bearer ')
		? headerAuth.slice('Bearer '.length)
		: undefined

	let requestBody: unknown

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		try {
			requestBody = await request.json()
		} catch {
			requestBody = undefined
		}
	}

	const effectiveToken = headerToken ?? getStrapiJwtFromRequest(request)

	const headers: Record<string, string> = {
		Accept: 'application/json',
	}

	if (requestBody !== undefined) {
		headers['Content-Type'] = 'application/json'
	}

	if (typeof effectiveToken === 'string' && effectiveToken.length > 0) {
		headers.Authorization = `Bearer ${effectiveToken}`
	}

	const response = await fetch(targetUrl, {
		method: request.method,
		headers,
		body: requestBody !== undefined
			? JSON.stringify(requestBody)
			: undefined,
		cache: 'no-store',
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok) {
		const message = payload?.error?.message
			?? `Strapi-Anfrage fehlgeschlagen (${response.status})`

		return NextResponse.json(
			{ error: { message } },
			{ status: response.status },
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

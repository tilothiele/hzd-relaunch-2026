import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
	STRAPI_JWT_COOKIE,
	isStrapiJwtExpired,
} from '@/lib/auth-cookie'
import { sanitizeCallbackUrl } from '@/lib/auth-login'

function clearJwtCookie(response: NextResponse) {
	response.cookies.set(STRAPI_JWT_COOKIE, '', {
		path: '/',
		maxAge: 0,
	})
	return response
}

export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl
	const token = request.cookies.get(STRAPI_JWT_COOKIE)?.value ?? ''
	const hasToken = token.length > 0
	const hasValidToken = hasToken && !isStrapiJwtExpired(token)

	const isPublicPath = pathname === '/login'
		|| pathname.startsWith('/_next')
		|| pathname.startsWith('/static')
		|| pathname.includes('.')

	if (!hasValidToken && !isPublicPath) {
		const loginUrl = new URL('/login', request.url)
		if (hasToken) {
			loginUrl.searchParams.set('error', 'SessionExpired')
		}

		const callbackUrl = `${pathname}${search}`
		if (callbackUrl !== '/') {
			loginUrl.searchParams.set('callbackUrl', callbackUrl)
		}

		const response = NextResponse.redirect(loginUrl)
		if (hasToken) {
			return clearJwtCookie(response)
		}

		return response
	}

	if (hasValidToken && pathname === '/login') {
		const callbackUrl = sanitizeCallbackUrl(
			request.nextUrl.searchParams.get('callbackUrl'),
		)
		return NextResponse.redirect(new URL(callbackUrl, request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

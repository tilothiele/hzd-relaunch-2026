import type { NextRequest, NextResponse } from 'next/server'

export const STRAPI_JWT_COOKIE = 'hzd_strapi_jwt'

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7

export function getStrapiJwtCookieOptions() {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax' as const,
		path: '/',
		maxAge: SEVEN_DAYS_SECONDS,
	}
}

export function getStrapiJwtFromRequest(request: NextRequest): string | null {
	const value = request.cookies.get(STRAPI_JWT_COOKIE)?.value
	return value && value.length > 0 ? value : null
}

export function applyStrapiJwtCookie(response: NextResponse, jwt: string) {
	response.cookies.set(STRAPI_JWT_COOKIE, jwt, getStrapiJwtCookieOptions())
	return response
}

export function clearStrapiJwtCookie(response: NextResponse) {
	response.cookies.set(STRAPI_JWT_COOKIE, '', {
		...getStrapiJwtCookieOptions(),
		maxAge: 0,
	})
	return response
}

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

export function isStrapiJwtExpired(token: string): boolean {
	const part = token.split('.')[1]
	if (!part) {
		return true
	}

	try {
		const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
		const padding = (4 - (normalized.length % 4)) % 4
		const payload = JSON.parse(
			atob(normalized.padEnd(normalized.length + padding, '=')),
		) as { exp?: unknown }

		if (typeof payload.exp !== 'number') {
			return false
		}

		return payload.exp * 1000 <= Date.now()
	} catch {
		return true
	}
}

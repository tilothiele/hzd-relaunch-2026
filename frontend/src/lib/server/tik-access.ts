import { NextRequest, NextResponse } from 'next/server'
import { getStrapiJwtFromRequest } from '@/lib/auth-cookie'
import { TIK_ACCESS_DENIED_MESSAGE, isTik } from '@/lib/permissions'
import { fetchMe } from '@/lib/strapi/api'
import type { AuthUser } from '@/types'

export function tikDeniedResponse(): NextResponse {
	return NextResponse.json(
		{ message: TIK_ACCESS_DENIED_MESSAGE },
		{ status: 401 },
	)
}

export async function requireTikUser(
	request: NextRequest,
): Promise<AuthUser | NextResponse> {
	const jwt = getStrapiJwtFromRequest(request)
	if (!jwt) {
		return tikDeniedResponse()
	}

	try {
		const { me } = await fetchMe(jwt, { server: true })
		if (!me || !isTik(me)) {
			return tikDeniedResponse()
		}
		return me
	} catch (error) {
		console.error('[TIK] Zugriffsprüfung fehlgeschlagen:', error)
		return tikDeniedResponse()
	}
}

export function isTikDenied(
	result: AuthUser | NextResponse,
): result is NextResponse {
	return result instanceof NextResponse
}

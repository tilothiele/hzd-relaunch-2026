import { NextRequest, NextResponse } from 'next/server'
import {
	clearStrapiJwtCookie,
	getStrapiJwtFromRequest,
} from '@/lib/auth-cookie'
import { fetchMe, StrapiUnauthorizedError } from '@/lib/strapi-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	const jwt = getStrapiJwtFromRequest(request)

	if (!jwt) {
		return NextResponse.json({ jwt: null, user: null })
	}

	try {
		const user = await fetchMe(jwt)
		return NextResponse.json({ jwt, user })
	} catch (error) {
		if (error instanceof StrapiUnauthorizedError) {
			const response = NextResponse.json(
				{ jwt: null, user: null },
				{ status: 401 },
			)
			return clearStrapiJwtCookie(response)
		}

		console.error('[Auth] Session konnte nicht geladen werden:', error)
		return NextResponse.json({ jwt, user: null })
	}
}

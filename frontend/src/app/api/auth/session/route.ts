import { NextRequest, NextResponse } from 'next/server'
import {
	clearStrapiJwtCookie,
	getStrapiJwtFromRequest,
} from '@/lib/auth-cookie'
import { fetchMe } from '@/lib/strapi/api'
import { isStrapiUnauthorizedError } from '@/lib/strapi-errors'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	const jwt = getStrapiJwtFromRequest(request)

	if (!jwt) {
		return NextResponse.json({ jwt: null, user: null })
	}

	try {
		const meData = await fetchMe(jwt, { server: true })
		return NextResponse.json({
			jwt,
			user: meData.me,
		})
	} catch (error) {
		if (isStrapiUnauthorizedError(error)) {
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

import { NextRequest, NextResponse } from 'next/server'
import { applyStrapiJwtCookie } from '@/lib/auth-cookie'
import { mapStrapiAuthError } from '@/lib/auth-errors'
import {
	loginWithStrapi,
	StrapiAuthRequestError,
} from '@/lib/server/strapi-auth'
import { fetchMe, normalizeAuthUser } from '@/lib/strapi-api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	let identifier = ''
	let password = ''

	try {
		const body = await request.json() as {
			identifier?: unknown
			password?: unknown
		}
		identifier = typeof body.identifier === 'string'
			? body.identifier.trim()
			: ''
		password = typeof body.password === 'string' ? body.password : ''
	} catch {
		return NextResponse.json(
			{ error: { message: 'Ungültige Anfrage.' } },
			{ status: 400 },
		)
	}

	if (!identifier || !password) {
		return NextResponse.json(
			{
				error: {
					message: 'Bitte E-Mail/Benutzername und Passwort eingeben.',
				},
			},
			{ status: 400 },
		)
	}

	try {
		const result = await loginWithStrapi(identifier, password)
		const me = await fetchMe(result.jwt).catch(() => null)
		const user = me ?? normalizeAuthUser(result.user)
		const response = NextResponse.json({
			jwt: result.jwt,
			user,
		})
		return applyStrapiJwtCookie(response, result.jwt)
	} catch (error) {
		if (error instanceof StrapiAuthRequestError) {
			const status = error.status >= 400 && error.status < 600
				? error.status
				: 400

			return NextResponse.json(
				{ error: { message: mapStrapiAuthError(error.message) } },
				{ status },
			)
		}

		console.error('[Auth] Anmeldung fehlgeschlagen:', error)
		return NextResponse.json(
			{ error: { message: 'Anmeldung fehlgeschlagen.' } },
			{ status: 500 },
		)
	}
}

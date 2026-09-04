import { NextRequest, NextResponse } from 'next/server'
import { applyStrapiJwtCookie } from '@/lib/auth-cookie'
import { mapStrapiAuthError } from '@/lib/auth-errors'
import {
	resetPasswordWithStrapi,
	StrapiAuthRequestError,
} from '@/lib/server/strapi-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	let code = ''
	let password = ''
	let passwordConfirmation = ''

	try {
		const body = await request.json() as {
			code?: unknown
			password?: unknown
			passwordConfirmation?: unknown
		}
		code = typeof body.code === 'string' ? body.code.trim() : ''
		password = typeof body.password === 'string' ? body.password : ''
		passwordConfirmation = typeof body.passwordConfirmation === 'string'
			? body.passwordConfirmation
			: ''
	} catch {
		return NextResponse.json(
			{ error: { message: 'Ungültige Anfrage.' } },
			{ status: 400 },
		)
	}

	if (!code) {
		return NextResponse.json(
			{ error: { message: 'Der Link ist ungültig oder unvollständig.' } },
			{ status: 400 },
		)
	}

	if (!password || !passwordConfirmation) {
		return NextResponse.json(
			{ error: { message: 'Bitte das neue Passwort zweimal eingeben.' } },
			{ status: 400 },
		)
	}

	if (password !== passwordConfirmation) {
		return NextResponse.json(
			{ error: { message: 'Die Passwörter stimmen nicht überein.' } },
			{ status: 400 },
		)
	}

	try {
		const result = await resetPasswordWithStrapi({
			code,
			password,
			passwordConfirmation,
		})
		const response = NextResponse.json({
			jwt: result.jwt,
			user: result.user,
		})
		return applyStrapiJwtCookie(response, result.jwt)
	} catch (error) {
		if (error instanceof StrapiAuthRequestError) {
			return NextResponse.json(
				{ error: { message: mapStrapiAuthError(error.message) } },
				{ status: error.status >= 400 && error.status < 600 ? error.status : 400 },
			)
		}

		return NextResponse.json(
			{ error: { message: 'Passwort konnte nicht gesetzt werden.' } },
			{ status: 500 },
		)
	}
}

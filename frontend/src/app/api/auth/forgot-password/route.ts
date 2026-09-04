import { NextRequest, NextResponse } from 'next/server'
import { mapStrapiAuthError } from '@/lib/auth-errors'
import {
	forgotPasswordWithStrapi,
	StrapiAuthRequestError,
} from '@/lib/server/strapi-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
	let email = ''

	try {
		const body = await request.json() as { email?: unknown }
		email = typeof body.email === 'string' ? body.email.trim() : ''
	} catch {
		return NextResponse.json(
			{ error: { message: 'Ungültige Anfrage.' } },
			{ status: 400 },
		)
	}

	if (!email || !email.includes('@')) {
		return NextResponse.json(
			{ error: { message: 'Bitte eine gültige E-Mail-Adresse eingeben.' } },
			{ status: 400 },
		)
	}

	try {
		await forgotPasswordWithStrapi(email)
		return NextResponse.json({ ok: true })
	} catch (error) {
		if (error instanceof StrapiAuthRequestError) {
			return NextResponse.json(
				{ error: { message: mapStrapiAuthError(error.message) } },
				{ status: error.status >= 400 && error.status < 600 ? error.status : 400 },
			)
		}

		return NextResponse.json(
			{ error: { message: 'Die Anfrage ist fehlgeschlagen.' } },
			{ status: 500 },
		)
	}
}

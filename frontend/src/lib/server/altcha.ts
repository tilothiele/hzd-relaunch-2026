import { deriveKey } from 'altcha-lib/algorithms/pbkdf2'
import {
	CappedMap,
	create,
	deriveHmacKeySecret,
	randomInt,
} from 'altcha-lib/frameworks/nextjs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const ALTCHA_COOKIE = 'altcha'

export const ALTCHA_FAILURE_MESSAGE =
	'Die Bot-Prüfung ist fehlgeschlagen. Bitte bestätigen Sie, dass Sie kein automatisiertes Programm sind.'

const CHALLENGE_TTL_MS = 10 * 60 * 1000
const usedChallenges = new CappedMap<string, boolean>({ maxSize: 1000 })

type AltchaInstance = ReturnType<typeof create>

let instancePromise: Promise<AltchaInstance> | null = null
let hmacKeySignatureSecret: string | null = null

function readHmacSecret(): string {
	const secret = process.env.ALTCHA_HMAC_SECRET?.trim()
	if (!secret) {
		throw new Error('ALTCHA_HMAC_SECRET ist nicht gesetzt.')
	}
	return secret
}

export function getAltcha(): Promise<AltchaInstance> {
	if (!instancePromise) {
		instancePromise = (async () => {
			const secret = readHmacSecret()
			hmacKeySignatureSecret = await deriveHmacKeySecret(secret)
			return create({
				hmacSignatureSecret: secret,
				hmacKeySignatureSecret,
				deriveKey,
				createChallengeParameters: () => ({
					algorithm: 'PBKDF2/SHA-256',
					cost: 2_000,
					counter: randomInt(800, 2_000),
					expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
				}),
				setCookie: {
					name: ALTCHA_COOKIE,
					path: '/',
					sameSite: 'Lax',
					maxAge: CHALLENGE_TTL_MS / 1000,
					secure: process.env.NODE_ENV === 'production',
				},
				store: usedChallenges,
			})
		})().catch((error) => {
			instancePromise = null
			hmacKeySignatureSecret = null
			throw error
		})
	}
	return instancePromise
}

export function clearAltchaCookie(response: NextResponse): NextResponse {
	response.cookies.set(ALTCHA_COOKIE, '', {
		path: '/',
		maxAge: 0,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
	})
	return response
}

async function verifyPayload(payload: string | undefined) {
	const altcha = await getAltcha()
	return altcha.verify(
		payload,
		deriveKey,
		readHmacSecret(),
		hmacKeySignatureSecret ?? undefined,
		usedChallenges,
	)
}

function failureResponse(): NextResponse {
	return clearAltchaCookie(NextResponse.json(
		{
			message: ALTCHA_FAILURE_MESSAGE,
			error: { message: ALTCHA_FAILURE_MESSAGE },
		},
		{ status: 403 },
	))
}

/**
 * Prüft das ALTCHA-Cookie. Bei Erfolg ist der Nachweis verbraucht.
 * Gibt eine 403-Antwort zurück, wenn die Prüfung fehlschlägt.
 */
export async function guardAltcha(
	request: Request,
): Promise<NextResponse | null> {
	try {
		const altcha = await getAltcha()
		const payload = await altcha.getPayloadFromRequest(request, ALTCHA_COOKIE)
		const result = await verifyPayload(payload)
		if (result.error) {
			console.warn(`ALTCHA abgelehnt: ${result.error}`)
			return failureResponse()
		}
		return null
	} catch (error) {
		console.error('ALTCHA-Prüfung fehlgeschlagen:', error)
		return NextResponse.json(
			{
				message: 'Die Bot-Prüfung ist derzeit nicht verfügbar.',
				error: { message: 'Die Bot-Prüfung ist derzeit nicht verfügbar.' },
			},
			{ status: 503 },
		)
	}
}

export async function withAltcha(
	request: Request,
	handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
	const blocked = await guardAltcha(request)
	if (blocked) {
		return blocked
	}
	const response = await handler()
	return clearAltchaCookie(response)
}

/** Für Server Actions, die das Cookie aus dem Next-Cookie-Store lesen. */
export async function consumeAltchaFromCookies(): Promise<string | null> {
	try {
		const payload = cookies().get(ALTCHA_COOKIE)?.value
		const result = await verifyPayload(payload)
		cookies().set(ALTCHA_COOKIE, '', {
			path: '/',
			maxAge: 0,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		})
		if (result.error) {
			console.warn(`ALTCHA abgelehnt: ${result.error}`)
			return ALTCHA_FAILURE_MESSAGE
		}
		return null
	} catch (error) {
		console.error('ALTCHA-Prüfung fehlgeschlagen:', error)
		return 'Die Bot-Prüfung ist derzeit nicht verfügbar.'
	}
}

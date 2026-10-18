import { getStrapiBaseUrl } from '@/lib/strapi-api'

export interface StrapiAuthSuccess {
	jwt: string
	user: Record<string, unknown>
}

export class StrapiAuthRequestError extends Error {
	status: number

	constructor(message: string, status: number) {
		super(message)
		this.name = 'StrapiAuthRequestError'
		this.status = status
	}
}

function extractErrorMessage(payload: unknown, fallback: string): string {
	if (payload && typeof payload === 'object' && 'error' in payload) {
		const error = (payload as { error?: { message?: string } }).error
		if (typeof error?.message === 'string' && error.message.length > 0) {
			return error.message
		}
	}

	return fallback
}

export async function loginWithStrapi(
	identifier: string,
	password: string,
): Promise<StrapiAuthSuccess> {
	let response: Response

	try {
		response = await fetch(`${getStrapiBaseUrl()}/api/auth/local`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ identifier, password }),
			cache: 'no-store',
		})
	} catch (error) {
		console.error('[Auth] Strapi nicht erreichbar:', error)
		throw new StrapiAuthRequestError(
			'Das Backend ist derzeit nicht erreichbar.',
			503,
		)
	}

	const payload = await response.json().catch(() => null)

	if (!response.ok) {
		throw new StrapiAuthRequestError(
			extractErrorMessage(payload, 'Authentifizierung fehlgeschlagen'),
			response.status,
		)
	}

	const result = payload as Partial<StrapiAuthSuccess> | null
	if (
		!result
		|| typeof result.jwt !== 'string'
		|| !result.user
		|| typeof result.user !== 'object'
	) {
		throw new StrapiAuthRequestError(
			'Authentifizierung fehlgeschlagen',
			502,
		)
	}

	return {
		jwt: result.jwt,
		user: result.user,
	}
}

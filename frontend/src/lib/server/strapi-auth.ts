import { getStrapiPublicBaseUrl } from '@/lib/server/strapi-client'

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

async function postStrapiAuth<T>(path: string, body: unknown): Promise<T> {
	const response = await fetch(`${getStrapiPublicBaseUrl()}/api/${path}`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		cache: 'no-store',
	})

	const payload = await response.json().catch(() => null)

	if (!response.ok) {
		throw new StrapiAuthRequestError(
			extractErrorMessage(payload, 'Authentifizierung fehlgeschlagen'),
			response.status,
		)
	}

	return payload as T
}

export function loginWithStrapi(identifier: string, password: string) {
	return postStrapiAuth<StrapiAuthSuccess>('auth/local', {
		identifier,
		password,
	})
}

export function forgotPasswordWithStrapi(email: string) {
	return postStrapiAuth<{ ok: boolean }>('auth/forgot-password', { email })
}

export function resetPasswordWithStrapi(input: {
	code: string
	password: string
	passwordConfirmation: string
}) {
	return postStrapiAuth<StrapiAuthSuccess>('auth/reset-password', input)
}

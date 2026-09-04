import { mapStrapiAuthError } from '@/lib/auth-errors'
import type { AuthUser } from '@/types'

interface AuthErrorPayload {
	error?: { message?: string }
}

interface AuthSessionPayload {
	jwt?: string | null
	user?: AuthUser | null
}

async function readAuthError(response: Response): Promise<string> {
	const payload = await response.json().catch(() => null) as AuthErrorPayload | null
	return mapStrapiAuthError(payload?.error?.message)
}

export async function fetchAuthSession(): Promise<AuthSessionPayload> {
	const response = await fetch('/api/auth/session', {
		method: 'GET',
		credentials: 'include',
		cache: 'no-store',
	})

	if (!response.ok) {
		return { jwt: null, user: null }
	}

	return await response.json() as AuthSessionPayload
}

export async function loginWithPassword(
	identifier: string,
	password: string,
): Promise<{ jwt: string; user: AuthUser | null }> {
	const response = await fetch('/api/auth/login', {
		method: 'POST',
		credentials: 'include',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ identifier, password }),
	})

	if (!response.ok) {
		throw new Error(await readAuthError(response))
	}

	return await response.json() as { jwt: string; user: AuthUser | null }
}

export async function logoutFromBackend(): Promise<void> {
	await fetch('/api/auth/logout', {
		method: 'POST',
		credentials: 'include',
		cache: 'no-store',
	})
}

export async function requestPasswordReset(email: string): Promise<void> {
	const response = await fetch('/api/auth/forgot-password', {
		method: 'POST',
		credentials: 'include',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ email }),
	})

	if (!response.ok) {
		throw new Error(await readAuthError(response))
	}
}

export async function resetPasswordWithCode(input: {
	code: string
	password: string
	passwordConfirmation: string
}): Promise<{ jwt: string; user: AuthUser | null }> {
	const response = await fetch('/api/auth/reset-password', {
		method: 'POST',
		credentials: 'include',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(input),
	})

	if (!response.ok) {
		throw new Error(await readAuthError(response))
	}

	return await response.json() as { jwt: string; user: AuthUser | null }
}

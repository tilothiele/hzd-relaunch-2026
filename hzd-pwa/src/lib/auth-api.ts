import { mapStrapiAuthError } from '@/lib/auth-errors'
import type { AuthUser } from '@/types/auth-user'

interface AuthErrorPayload {
	error?: { message?: string }
}

export interface AuthSessionPayload {
	jwt?: string | null
	user?: AuthUser | null
	expired?: boolean
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

	if (response.status === 401) {
		return { jwt: null, user: null, expired: true }
	}

	if (!response.ok) {
		return { jwt: null, user: null }
	}

	return await response.json() as AuthSessionPayload
}

export async function loginWithPassword(
	identifier: string,
	password: string,
): Promise<{ jwt: string, user: AuthUser | null }> {
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

	return await response.json() as { jwt: string, user: AuthUser | null }
}

export async function logoutFromBackend(): Promise<void> {
	await fetch('/api/auth/logout', {
		method: 'POST',
		credentials: 'include',
		cache: 'no-store',
	})
}

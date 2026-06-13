import type { AuthUser } from '@/types/auth-user'

function getStrapiBaseUrl(): string {
	return (process.env.STRAPI_BASE_URL ?? 'http://localhost:1337').replace(/\/$/, '')
}

export async function fetchMe(token: string): Promise<AuthUser | null> {
	const params = new URLSearchParams({
		'populate[role]': '*',
		'populate[member][populate]': '*',
	})

	const response = await fetch(
		`${getStrapiBaseUrl()}/api/users/me?${params.toString()}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/json',
			},
			cache: 'no-store',
		},
	)

	if (!response.ok) {
		return null
	}

	const user = await response.json() as AuthUser
	return user?.documentId ? user : null
}

export function createFallbackUser(sessionUser: {
	name?: string | null
	email?: string | null
} | undefined): AuthUser | null {
	if (!sessionUser?.email && !sessionUser?.name) {
		return null
	}

	const username = sessionUser.name ?? sessionUser.email ?? 'Account'

	return {
		id: sessionUser.email ?? username,
		documentId: sessionUser.email ?? username,
		username,
		email: sessionUser.email ?? null,
	}
}

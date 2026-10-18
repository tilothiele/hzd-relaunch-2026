import type { AuthUser } from '@/types/auth-user'

export class StrapiUnauthorizedError extends Error {
	constructor() {
		super('Strapi-Sitzung ist ungültig.')
		this.name = 'StrapiUnauthorizedError'
	}
}

export function getStrapiBaseUrl(): string {
	return (process.env.STRAPI_BASE_URL ?? 'http://localhost:1337').replace(
		/\/$/,
		'',
	)
}

export function normalizeAuthUser(payload: unknown): AuthUser | null {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		return null
	}

	const record = payload as Record<string, unknown>
	const documentId = typeof record.documentId === 'string'
		? record.documentId
		: null
	const rawId = record.id
	const id = typeof rawId === 'string' || typeof rawId === 'number'
		? String(rawId)
		: documentId
	const username = typeof record.username === 'string'
		? record.username
		: typeof record.email === 'string'
			? record.email
			: null

	if (!id && !username) {
		return null
	}

	return {
		id: id ?? username ?? 'Account',
		documentId: documentId ?? id ?? username ?? 'Account',
		username: username ?? 'Account',
		email: typeof record.email === 'string' ? record.email : null,
		firstName: typeof record.firstName === 'string'
			? record.firstName
			: null,
		lastName: typeof record.lastName === 'string' ? record.lastName : null,
		user_groups: Array.isArray(record.user_groups)
			? record.user_groups as AuthUser['user_groups']
			: null,
	}
}

export function formatAuthDisplayName(
	user: AuthUser | null | undefined,
): string {
	const name = [user?.firstName, user?.lastName]
		.filter((part): part is string => Boolean(part && part.trim()))
		.join(' ')
		.trim()

	if (name) {
		return name
	}

	return user?.username || user?.email || 'Gast'
}

export async function fetchMe(token: string): Promise<AuthUser | null> {
	const params = new URLSearchParams({
		'populate[role]': '*',
		'populate[user_groups]': '*',
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

	if (response.status === 401 || response.status === 403) {
		throw new StrapiUnauthorizedError()
	}

	if (!response.ok) {
		return null
	}

	return normalizeAuthUser(await response.json())
}

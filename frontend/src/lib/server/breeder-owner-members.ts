import { fetchStrapiServer } from '@/lib/server/strapi-client'
import type { AuthUser } from '@/types'

const USER_CONTACT_FIELDS = [
	'documentId',
	'cId',
	'firstName',
	'lastName',
	'region',
	'phone',
	'cEmail',
	'city',
	'address1',
	'address2',
	'zip',
	'countryCode',
	'locationLat',
	'locationLng',
	'publishMyData',
] as const

function sanitizePublicUser(user: Record<string, unknown> | null | undefined): AuthUser | null {
	if (!user || typeof user.id === 'undefined') {
		return null
	}

	if (user.publishMyData === true) {
		return user as unknown as AuthUser
	}

	return {
		id: String(user.id),
		documentId: String(user.documentId ?? ''),
		cId: typeof user.cId === 'number' ? user.cId : null,
		username: `user-${user.id}`,
		email: `user-${user.id}@hovawarte.com`,
	}
}

function buildUserFieldsQuery(): URLSearchParams {
	const params = new URLSearchParams()
	USER_CONTACT_FIELDS.forEach((field, index) => {
		params.set(`fields[${index}]`, field)
	})
	params.set('pagination[pageSize]', '50')
	return params
}

function extractUsers(response: unknown): Record<string, unknown>[] {
	if (Array.isArray(response)) {
		return response as Record<string, unknown>[]
	}

	if (Array.isArray((response as { data?: unknown[] })?.data)) {
		return (response as { data: Record<string, unknown>[] }).data
	}

	return []
}

export async function loadOwnerMembersByBreederDocumentId(
	breederDocumentId: string,
	token: string,
): Promise<AuthUser[]> {
	const query = buildUserFieldsQuery()
	query.set('filters[breeders][documentId][$eq]', breederDocumentId)

	const response = await fetchStrapiServer<unknown>(
		`users?${query.toString()}`,
		undefined,
		{ token },
	)

	return extractUsers(response)
		.map(sanitizePublicUser)
		.filter((user): user is AuthUser => user != null)
}

export async function loadOwnerMembersByBreederDocumentIds(
	breederDocumentIds: string[],
	token: string,
): Promise<Record<string, AuthUser[]>> {
	const uniqueDocumentIds = [...new Set(breederDocumentIds.filter(Boolean))]
	if (uniqueDocumentIds.length === 0) {
		return {}
	}

	const entries = await Promise.all(
		uniqueDocumentIds.map(async (documentId) => {
			const members = await loadOwnerMembersByBreederDocumentId(documentId, token)
			return [documentId, members] as const
		}),
	)

	return Object.fromEntries(entries)
}

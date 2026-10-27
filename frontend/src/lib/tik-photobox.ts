export interface TikPhotoboxPhoto {
	documentId: string
	renderedPersons: string | null
	renderedDogs: string | null
	userMessage: string | null
	fileName: string | null
	thumbnailUrl: string | null
	createdAt: string | null
	hasOriginal: boolean
}

export interface TikPhotoboxPhotographer {
	membershipNumber: number | null
	displayName: string | null
}

export interface TikPhotoboxCollection {
	documentId: string
	description: string | null
	location: string | null
	createdAt: string | null
	photographer: TikPhotoboxPhotographer | null
	photos: TikPhotoboxPhoto[]
}

export interface TikPhotoboxPageInfo {
	page: number
	pageSize: number
	pageCount: number
	total: number
}

export interface TikPhotoboxSearchResult {
	collections: TikPhotoboxCollection[]
	pageInfo: TikPhotoboxPageInfo
}

export interface TikPhotoboxSearchParams {
	membershipNumber?: string
	term?: string
	page: number
	pageSize: number
}

export interface TikPhotoboxDeleteResult {
	message: string
	warnings: string[]
}

async function readErrorMessage(response: Response): Promise<string> {
	const payload = await response.json().catch(() => null) as {
		message?: unknown
	} | null
	if (payload && typeof payload.message === 'string' && payload.message) {
		return payload.message
	}
	return `Anfrage fehlgeschlagen (${response.status})`
}

export function tikPhotoboxDownloadUrl(documentId: string): string {
	return `/api/tik/photobox/images/${encodeURIComponent(documentId)}/download`
}

export async function searchTikPhotobox(
	params: TikPhotoboxSearchParams,
): Promise<TikPhotoboxSearchResult> {
	const query = new URLSearchParams()
	if (params.membershipNumber) {
		query.set('membershipNumber', params.membershipNumber)
	}
	if (params.term) {
		query.set('term', params.term)
	}
	query.set('page', String(params.page))
	query.set('pageSize', String(params.pageSize))

	const response = await fetch(`/api/tik/photobox?${query.toString()}`, {
		cache: 'no-store',
	})
	if (!response.ok) {
		throw new Error(await readErrorMessage(response))
	}
	return response.json() as Promise<TikPhotoboxSearchResult>
}

async function deleteTikResource(url: string): Promise<TikPhotoboxDeleteResult> {
	const response = await fetch(url, { method: 'DELETE' })
	if (!response.ok) {
		throw new Error(await readErrorMessage(response))
	}
	const payload = await response.json().catch(() => null) as {
		message?: unknown
		warnings?: unknown
	} | null
	const warnings = Array.isArray(payload?.warnings)
		? payload.warnings.filter((item): item is string => typeof item === 'string')
		: []
	return {
		message: typeof payload?.message === 'string'
			? payload.message
			: 'Gelöscht.',
		warnings,
	}
}

export function deleteTikPhotoboxImage(
	documentId: string,
): Promise<TikPhotoboxDeleteResult> {
	const url = `/api/tik/photobox/images/${encodeURIComponent(documentId)}`
	return deleteTikResource(url)
}

export function deleteTikPhotoboxCollection(
	documentId: string,
): Promise<TikPhotoboxDeleteResult> {
	const url = `/api/tik/photobox/collections/${encodeURIComponent(documentId)}`
	return deleteTikResource(url)
}

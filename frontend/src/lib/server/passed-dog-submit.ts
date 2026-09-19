import { cookies } from 'next/headers'
import { STRAPI_JWT_COOKIE } from '@/lib/auth-cookie'
import { getRequestClientIp } from '@/lib/server/request-ip'
import {
	createEntity,
	fetchEntityList,
	fetchMe,
	updateEntity,
} from '@/lib/strapi/api'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import { POPULATE_PASSED_DOG } from '@/lib/strapi/populate'
import { getStrapiPublicBaseUrl } from '@/lib/server/strapi-client'
import {
	MAX_PENDING_PASSED_DOGS,
	passedDogDateBounds,
} from '@/lib/passed-dogs-limits'
import type { AuthUser } from '@/types'
import type { PassedDogCardData } from './passed-dog-utils'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_AVATAR_BYTES = Number(
	process.env.STRAPI_PUBLIC_MAX_PHOTO_SIZE_MB || 10,
) * 1024 * 1024

export type PassedDogMutationResult =
	| { ok: true }
	| { ok: false; error: string }

function getStrapiApiToken(): string {
	const token = process.env.STRAPI_API_TOKEN?.trim()
	if (!token) {
		throw new Error('STRAPI_API_TOKEN ist nicht gesetzt.')
	}
	return token
}

function apiOptions() {
	return {
		server: true as const,
		token: getStrapiApiToken(),
	}
}

function asTrimmedString(value: FormDataEntryValue | null): string {
	return typeof value === 'string' ? value.trim() : ''
}

function asOptionalFile(value: FormDataEntryValue | null): File | null {
	if (!value || typeof value === 'string') {
		return null
	}
	const candidate = value as File
	if (typeof candidate.size === 'number' && candidate.size > 0) {
		return candidate
	}
	return null
}

function normalizeEmail(value: string): string {
	return value.trim().toLowerCase()
}

export { getRequestClientIp }

export async function getSessionUser(): Promise<AuthUser | null> {
	const jwt = (await cookies()).get(STRAPI_JWT_COOKIE)?.value
	if (!jwt) {
		return null
	}
	try {
		const result = await fetchMe(jwt, { server: true })
		return result.me
	} catch {
		return null
	}
}

export function sessionContactEmail(user: AuthUser | null): string | null {
	const email = user?.cEmail?.trim() || user?.email?.trim()
	return email ? normalizeEmail(email) : null
}

async function countPendingByEmail(email: string): Promise<number> {
	const query = buildStrapiQuery({
		filters: {
			and: [
				{ EMail: { eq: email } },
				{ not: { Approved: { eq: true } } },
			],
		},
		fields: ['documentId'],
		pagination: { pageSize: 100 },
	})
	const rows = await fetchEntityList<{ documentId: string }>(
		'passed-dogs',
		query,
		apiOptions(),
	)
	return rows.length
}

async function uploadAvatar(
	file: File,
	token: string,
): Promise<string | number> {
	if (file.size > MAX_AVATAR_BYTES) {
		const maxMb = Math.round(MAX_AVATAR_BYTES / (1024 * 1024))
		throw new Error(`Das Bild ist zu groß. Maximal ${maxMb} MB.`)
	}

	const fd = new FormData()
	fd.append('files', file, file.name)
	const res = await fetch(`${getStrapiPublicBaseUrl()}/api/upload`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: fd,
	})
	if (!res.ok) {
		const t = await res.text()
		throw new Error(t || 'Bild-Upload fehlgeschlagen.')
	}
	const data = (await res.json()) as Array<{
		id?: number
		documentId?: string
	}>
	const first = Array.isArray(data) ? data[0] : null
	const id = first?.id ?? first?.documentId
	if (id === undefined || id === null) {
		throw new Error('Ungültige Upload-Antwort.')
	}
	return id
}

function validatePayload(input: {
	dogName: string
	datePassed: string
	userName: string
	email: string
}): string | null {
	if (!input.dogName) {
		return 'Bitte geben Sie den Namen des Hundes an.'
	}
	if (!input.userName) {
		return 'Bitte geben Sie Ihren Namen an.'
	}
	if (!input.email || !EMAIL_PATTERN.test(input.email)) {
		return 'Bitte geben Sie eine gültige E-Mail-Adresse an.'
	}
	if (!input.datePassed) {
		return 'Bitte wählen Sie das Sterbedatum.'
	}
	const { min, max } = passedDogDateBounds()
	if (input.datePassed < min || input.datePassed > max) {
		return 'Das Sterbedatum muss zwischen vor einem Jahr und heute liegen.'
	}
	return null
}

export async function createPassedDogFromForm(
	formData: FormData,
): Promise<PassedDogMutationResult> {
	try {
		const dogName = asTrimmedString(formData.get('dogName'))
		const datePassed = asTrimmedString(formData.get('datePassed'))
		const message = asTrimmedString(formData.get('message'))
		const userName = asTrimmedString(formData.get('userName'))
		const sessionEmail = sessionContactEmail(await getSessionUser())
		const email = sessionEmail
			?? normalizeEmail(asTrimmedString(formData.get('email')))
		const consent = formData.get('consent') === 'true'
		const healthInfo = asTrimmedString(formData.get('healthInfo'))
		const file = asOptionalFile(formData.get('avatar'))

		const validationError = validatePayload({
			dogName,
			datePassed,
			userName,
			email,
		})
		if (validationError) {
			return { ok: false, error: validationError }
		}

		const pendingCount = await countPendingByEmail(email)
		if (pendingCount >= MAX_PENDING_PASSED_DOGS) {
			return {
				ok: false,
				error:
					`Sie dürfen höchstens ${MAX_PENDING_PASSED_DOGS} Einträge `
					+ 'gleichzeitig in Prüfung haben.',
			}
		}

		const token = getStrapiApiToken()
		let avatarId: string | number | undefined
		if (file) {
			avatarId = await uploadAvatar(file, token)
		}

		const data: Record<string, unknown> = {
			DogName: dogName,
			DatePassed: datePassed,
			Message: message || null,
			UserName: userName,
			EMail: email,
			Consent: consent,
			Approved: false,
			HealthInfo: healthInfo || null,
			ClientIP: await getRequestClientIp(),
		}
		if (avatarId !== undefined) {
			data.Avatar = avatarId
		}

		await createEntity('passed-dogs', data, apiOptions())
		return { ok: true }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error
				? err.message
				: 'Speichern fehlgeschlagen.',
		}
	}
}

export async function updatePassedDogFromForm(
	documentId: string,
	formData: FormData,
): Promise<PassedDogMutationResult> {
	try {
		const trimmedId = documentId.trim()
		if (!trimmedId) {
			return { ok: false, error: 'Eintrag nicht gefunden.' }
		}

		const user = await getSessionUser()
		const sessionEmail = sessionContactEmail(user)
		if (!sessionEmail) {
			return {
				ok: false,
				error: 'Nur angemeldete Nutzer können Einträge bearbeiten.',
			}
		}

		const existingQuery = buildStrapiQuery({
			filters: { documentId: { eq: trimmedId } },
			pagination: { pageSize: 1 },
			populate: Object.fromEntries(POPULATE_PASSED_DOG.entries()),
		})
		const existing = (await fetchEntityList<PassedDogCardData>(
			'passed-dogs',
			existingQuery,
			apiOptions(),
		))[0]
		if (!existing) {
			return { ok: false, error: 'Eintrag nicht gefunden.' }
		}
		if (existing.Approved === true) {
			return {
				ok: false,
				error: 'Freigegebene Einträge können nicht mehr bearbeitet werden.',
			}
		}
		const existingEmail = existing.EMail
			? normalizeEmail(existing.EMail)
			: ''
		if (existingEmail !== sessionEmail) {
			return {
				ok: false,
				error: 'Sie dürfen diesen Eintrag nicht bearbeiten.',
			}
		}

		const dogName = asTrimmedString(formData.get('dogName'))
		const datePassed = asTrimmedString(formData.get('datePassed'))
		const message = asTrimmedString(formData.get('message'))
		const userName = asTrimmedString(formData.get('userName'))
		const consent = formData.get('consent') === 'true'
		const healthInfo = asTrimmedString(formData.get('healthInfo'))
		const file = asOptionalFile(formData.get('avatar'))

		const validationError = validatePayload({
			dogName,
			datePassed,
			userName,
			email: existingEmail,
		})
		if (validationError) {
			return { ok: false, error: validationError }
		}

		const token = getStrapiApiToken()
		const data: Record<string, unknown> = {
			DogName: dogName,
			DatePassed: datePassed,
			Message: message || null,
			UserName: userName,
			Consent: consent,
			HealthInfo: healthInfo || null,
		}
		if (file) {
			data.Avatar = await uploadAvatar(file, token)
		}

		await updateEntity('passed-dogs', trimmedId, data, apiOptions())
		return { ok: true }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error
				? err.message
				: 'Speichern fehlgeschlagen.',
		}
	}
}

export async function fetchPendingPassedDogsForSession(): Promise<
	PassedDogCardData[]
> {
	const user = await getSessionUser()
	const email = sessionContactEmail(user)
	if (!email) {
		return []
	}

	const query = buildStrapiQuery({
		filters: {
			and: [
				{ EMail: { eq: email } },
				{ not: { Approved: { eq: true } } },
			],
		},
		pagination: { pageSize: 100 },
		sort: ['updatedAt:desc'],
		populate: Object.fromEntries(POPULATE_PASSED_DOG.entries()),
	})
	return fetchEntityList<PassedDogCardData>(
		'passed-dogs',
		query,
		apiOptions(),
	)
}

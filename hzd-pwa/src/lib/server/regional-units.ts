import { getStrapiBaseUrl } from '@/lib/strapi-api'
import type {
	RegionalUnit,
	RegionalUnitCommunity,
	RegionalUnitPerson,
} from '@/lib/regional-unit'

interface StrapiListResponse {
	data?: unknown
}

function asText(value: unknown): string | null {
	return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}
	return value as Record<string, unknown>
}

function personEmail(record: Record<string, unknown>): string | null {
	return asText(record.cEmail) ?? asText(record.email)
}

function asPerson(value: unknown): RegionalUnitPerson | null {
	const record = asRecord(value)
	if (!record) return null
	const phone = asText(record.phone)
	const email = personEmail(record)
	if (!phone && !email) return null
	return { phone, email }
}

function asCommunity(value: unknown): RegionalUnitCommunity | null {
	const record = asRecord(value)
	const documentId = asText(record?.documentId)
	if (!record || !documentId) return null
	return {
		documentId,
		name: asText(record.Name),
		street: asText(record.Street),
		zipCode: asText(record.ZipCode),
		city: asText(record.City),
		ceo: asPerson(record.CEO),
		cfo: asPerson(record.CFO),
		secretary: asPerson(record.Secretary),
	}
}

function asRegionalUnit(value: unknown): RegionalUnit | null {
	const record = asRecord(value)
	const documentId = asText(record?.documentId)
	const name = asText(record?.Name)
	if (!record || !documentId || !name) return null
	const communities = Array.isArray(record.local_cummunities)
		? record.local_cummunities
			.map(asCommunity)
			.filter((community): community is RegionalUnitCommunity => community !== null)
		: []
	return {
		documentId,
		name,
		communities,
		ceo: asPerson(record.CEO),
		cfo: asPerson(record.CFO),
		secretary: asPerson(record.Secretary),
	}
}

function listUrl(): string {
	const params = new URLSearchParams({
		sort: 'Name:asc',
		'pagination[pageSize]': '100',
		'populate[local_cummunities][fields][0]': 'Name',
		'populate[local_cummunities][fields][1]': 'Street',
		'populate[local_cummunities][fields][2]': 'ZipCode',
		'populate[local_cummunities][fields][3]': 'City',
		'populate[local_cummunities][populate][CFO][fields][0]': 'phone',
		'populate[local_cummunities][populate][CFO][fields][1]': 'email',
		'populate[local_cummunities][populate][CFO][fields][2]': 'cEmail',
		'populate[local_cummunities][populate][CEO][fields][0]': 'phone',
		'populate[local_cummunities][populate][CEO][fields][1]': 'email',
		'populate[local_cummunities][populate][CEO][fields][2]': 'cEmail',
		'populate[local_cummunities][populate][Secretary][fields][0]': 'phone',
		'populate[local_cummunities][populate][Secretary][fields][1]': 'email',
		'populate[local_cummunities][populate][Secretary][fields][2]': 'cEmail',
		'populate[CFO][fields][0]': 'phone',
		'populate[CFO][fields][1]': 'email',
		'populate[CFO][fields][2]': 'cEmail',
		'populate[CEO][fields][0]': 'phone',
		'populate[CEO][fields][1]': 'email',
		'populate[CEO][fields][2]': 'cEmail',
		'populate[Secretary][fields][0]': 'phone',
		'populate[Secretary][fields][1]': 'email',
		'populate[Secretary][fields][2]': 'cEmail',
	})
	return `${getStrapiBaseUrl()}/api/regional-units?${params.toString()}`
}

/** Veröffentlichte RegionalUnits, sortiert nach Name. */
export async function listRegionalUnits(): Promise<RegionalUnit[]> {
	const response = await fetch(listUrl(), {
		headers: { Accept: 'application/json' },
		cache: 'no-store',
	})
	if (!response.ok) {
		throw new Error(
			`Regionalgruppen konnten nicht geladen werden (${response.status}).`,
		)
	}
	const payload = (await response.json()) as StrapiListResponse
	const rows = Array.isArray(payload.data) ? payload.data : []
	return rows
		.map(asRegionalUnit)
		.filter((unit): unit is RegionalUnit => unit !== null)
}

export async function getRegionalUnit(
	documentId: string,
): Promise<RegionalUnit | null> {
	const id = documentId.trim()
	if (!id) return null
	const units = await listRegionalUnits()
	return units.find((unit) => unit.documentId === id) ?? null
}

export async function getLocalCommunity(
	documentId: string,
): Promise<{
	unit: RegionalUnit
	community: RegionalUnitCommunity
} | null> {
	const id = documentId.trim()
	if (!id) return null
	const units = await listRegionalUnits()
	for (const unit of units) {
		const community = unit.communities.find(
			(candidate) => candidate.documentId === id,
		)
		if (community) return { unit, community }
	}
	return null
}

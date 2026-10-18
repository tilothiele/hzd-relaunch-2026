import type { Dog } from '@/services/db'

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}

	return value as Record<string, unknown>
}

function unwrapEntity(value: unknown): Record<string, unknown> | null {
	const record = asRecord(value)
	if (!record) {
		return null
	}

	const attributes = asRecord(record.attributes)
	if (!attributes) {
		return record
	}

	return {
		...attributes,
		id: record.id ?? attributes.id,
		documentId: record.documentId ?? attributes.documentId,
	}
}

function readString(
	record: Record<string, unknown> | null,
	...keys: string[]
): string {
	if (!record) {
		return ''
	}

	for (const key of keys) {
		const value = record[key]
		if (typeof value === 'string' && value.trim()) {
			return value.trim()
		}
		if (typeof value === 'number' && Number.isFinite(value)) {
			return String(value)
		}
	}

	return ''
}

function ownerDisplayName(owner: Record<string, unknown> | null): string {
	if (!owner) {
		return ''
	}

	const parts = [
		readString(owner, 'firstName'),
		readString(owner, 'lastName'),
	].filter(Boolean).join(' ')

	return parts || readString(owner, 'DisplayName', 'username', 'name', 'Name')
}

function fertileLabel(value: unknown): string {
	if (value === true) {
		return 'Ja'
	}
	if (value === false) {
		return 'Nein'
	}
	if (typeof value === 'string') {
		return value
	}

	return ''
}

export function mapStrapiDog(payload: unknown): Dog | null {
	const item = unwrapEntity(payload)
	if (!item) {
		return null
	}

	const documentId = readString(item, 'documentId', 'id')
	if (!documentId) {
		return null
	}

	const givenName = readString(item, 'givenName', 'GivenName')
	const fullkennelname = readString(
		item,
		'fullKennelName',
		'FullKennelName',
		'fullkennelname',
	) || givenName
	const owner = unwrapEntity(item.owner)
	const dateofdeath = readString(
		item,
		'dateOfDeath',
		'DateOfDeath',
		'dateofdeath',
	)

	return {
		documentId,
		fullkennelname,
		givenName,
		dateofbirth: readString(item, 'dateOfBirth', 'DateOfBirth', 'dateofbirth'),
		dateofdeath: dateofdeath || null,
		microchipNo: readString(item, 'microchipNo', 'MicrochipNo'),
		sex: readString(item, 'sex', 'Sex'),
		color: readString(item, 'color', 'Color'),
		ownerName: ownerDisplayName(owner),
		ownerMembershipNumber: readString(
			owner,
			'membershipNumber',
			'MembershipNumber',
		),
		cStudBookNumber: readString(item, 'cStudBookNumber', 'CStudBookNumber'),
		cFertile: fertileLabel(item.cFertile ?? item.CFertile),
	}
}

import type { Breeder } from '@/services/db'

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

function unwrapList(value: unknown): Record<string, unknown>[] {
	if (Array.isArray(value)) {
		return value
			.map((entry) => unwrapEntity(entry))
			.filter((entry): entry is Record<string, unknown> => entry !== null)
	}

	const record = asRecord(value)
	if (record && Array.isArray(record.data)) {
		return unwrapList(record.data)
	}

	return []
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
	}

	return ''
}

function joinParts(parts: string[], separator: string): string {
	return parts.filter(Boolean).join(separator)
}

function personName(user: Record<string, unknown> | null): string {
	if (!user) {
		return ''
	}

	return joinParts([
		readString(user, 'firstName'),
		readString(user, 'lastName'),
	], ' ') || readString(user, 'DisplayName', 'username')
}

export function formatPlzOrt(zip: string, city: string): string {
	return joinParts([zip, city], ' ')
}

export function mapStrapiBreeder(payload: unknown): Breeder | null {
	const item = unwrapEntity(payload)
	if (!item) {
		return null
	}

	const documentId = readString(item, 'documentId')
		|| (typeof item.id === 'number' || typeof item.id === 'string'
			? String(item.id)
			: '')
	if (!documentId) {
		return null
	}

	const address = unwrapEntity(item.Address)
	const owners = unwrapList(item.owner_members)
	const owner = owners[0] ?? null
	const ownerNames = owners.map((member) => personName(member)).filter(Boolean)

	const street = joinParts([
		readString(owner, 'address1') || readString(address, 'Address1'),
		readString(owner, 'address2') || readString(address, 'Address2'),
	], ', ')

	return {
		documentId,
		kennelName: readString(item, 'kennelName'),
		name: readString(address, 'FullName') || ownerNames.join(', '),
		street,
		zip: readString(owner, 'zip') || readString(address, 'Zip'),
		city: readString(owner, 'city') || readString(address, 'City'),
		phone: readString(owner, 'phone'),
		email: readString(owner, 'cEmail') || readString(item, 'BreederEmail'),
		role: readString(item, 'BreederRole'),
		isActive: item.IsActive === true,
		disabled: item.Disable === true,
	}
}

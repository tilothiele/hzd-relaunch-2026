export type BreederListOrder = 'random' | 'zip'

const SEED_PATTERN = /^[A-Za-z0-9_-]{8,64}$/

export function sanitizeListSeed(
	value: string | null | undefined,
): string {
	const trimmed = value?.trim() ?? ''
	return SEED_PATTERN.test(trimmed) ? trimmed : ''
}

/** Seed für eine Suche. Bleibt über das Blättern gleich. */
export function createSearchSeed(): string {
	const bytes = new Uint8Array(12)
	crypto.getRandomValues(bytes)
	return Array.from(
		bytes,
		(byte) => byte.toString(16).padStart(2, '0'),
	).join('')
}

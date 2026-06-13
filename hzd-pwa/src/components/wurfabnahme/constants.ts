export type WurfabnahmePageId = 'stammblatt' | 'welpe1' | 'datenschutz1'

export const WURFABNAHME_TABS: { id: WurfabnahmePageId; label: string }[] = [
	{ id: 'stammblatt', label: 'Stammblatt' },
	{ id: 'welpe1', label: 'Welpe 1' },
	{ id: 'datenschutz1', label: 'Datenschutz' },
]

export function getWurfabnahmeHref(id: WurfabnahmePageId): string {
	return id === 'stammblatt' ? '/wurfabnahme' : `/wurfabnahme?seite=${id}`
}

export function parseWurfabnahmePage(
	seite: string | null,
): WurfabnahmePageId {
	if (seite === 'welpe1' || seite === 'datenschutz1') {
		return seite
	}

	return 'stammblatt'
}

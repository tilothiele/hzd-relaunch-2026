export type WurfabnahmePageId = 'stammblatt' | 'welpe1' | 'datenschutz1'

export const WURFABNAHME_TABS: { id: WurfabnahmePageId; label: string }[] = [
	{ id: 'stammblatt', label: 'Stammblatt' },
	{ id: 'welpe1', label: 'Welpe 1' },
	{ id: 'datenschutz1', label: 'Datenschutz' },
]

export function getWurfabnahmeHref(
	basePath: string,
	id: WurfabnahmePageId,
): string {
	return id === 'stammblatt' ? basePath : `${basePath}?seite=${id}`
}

export function parseWurfabnahmePage(
	seite: string | null,
): WurfabnahmePageId {
	if (seite === 'welpe1' || seite === 'datenschutz1') {
		return seite
	}

	return 'stammblatt'
}

export function isWurfabnahmeEditPath(pathname: string): boolean {
	if (pathname === '/wurfabnahmen/neu') {
		return true
	}

	return /^\/wurfabnahmen\/[^/]+$/.test(pathname)
		&& pathname !== '/wurfabnahmen'
}

export function getWurfabnahmeEditBasePath(pathname: string): string | null {
	if (!isWurfabnahmeEditPath(pathname)) {
		return null
	}

	return pathname
}

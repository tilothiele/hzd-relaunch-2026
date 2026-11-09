// Regionalgruppen der HZD. Die IDs entsprechen den Attribut-Suffixen in Strapi
// (HZD Settings): Finanzverwaltung_Nord, _West, _Mitte, _Sued, _Ost, _HZD

export interface RegionalGroup {
	id: string
	label: string
}

export const REGIONAL_GROUPS: RegionalGroup[] = [
	{ id: 'Nord', label: 'Nord' },
	{ id: 'West', label: 'West' },
	{ id: 'Mitte', label: 'Mitte' },
	{ id: 'Sued', label: 'Süd' },
	{ id: 'Ost', label: 'Ost' },
	{ id: 'HZD', label: 'HZD' },
]

/**
 * Normalisiert jede regionale Angabe (Label "Süd", ID "Sued", "sud", …)
 * auf die kanonische Regionalgruppen-ID. Erkenntnislos: null.
 */
export function resolveRegionId(
	value: string | null | undefined,
): string | null {
	if (!value) return null
	const map: Record<string, string> = {
		nord: 'Nord',
		west: 'West',
		mitte: 'Mitte',
		sud: 'Sued',
		sued: 'Sued',
		'süd': 'Sued',
		ost: 'Ost',
		hzd: 'HZD',
	}
	return map[value.trim().toLowerCase()] ?? null
}

export function isRegionalGroupId(value: string | null | undefined): boolean {
	return resolveRegionId(value) !== null
}

export function getRegionalGroupLabel(id: string | null | undefined): string | null {
	const key = resolveRegionId(id)
	const group = REGIONAL_GROUPS.find((candidate) => candidate.id === key)
	return group ? group.label : null
}

export type ThemeId = 'A' | 'B' | 'C' | 'D'

export interface ThemeDefinition {
	id: ThemeId
	headerBackground: string
	footerBackground: string
	textColor: string
	headerFooterTextColor: string
	name: string
}

export const themes: Record<ThemeId, ThemeDefinition> = {
	A: {
		id: 'A',
		headerBackground: '#64574E',
		footerBackground: '#64574E',
        headerFooterTextColor: '#ffffff',
		textColor: '#565757',
		name: 'Klassisch',
	},
	B: {
		id: 'B',
		headerBackground: '#90C6BF',
		footerBackground: '#90C6BF',
        headerFooterTextColor: '#ffffff',
		textColor: '#565757',
		name: 'Nordic Breeze',
	},
	C: {
		id: 'C',
		headerBackground: '#FAD857',
		footerBackground: '#FAD857',
        headerFooterTextColor: '#ffffff',
		textColor: '#565757',
		name: 'Sommerlicht',
	},
	D: {
		id: 'D',
		headerBackground: '#A8267D',
		footerBackground: '#A8267D',
        headerFooterTextColor: '#ffffff',
		textColor: '#565757',
		name: 'Beerenzauber',
	},
}

export const DEFAULT_THEME_ID: ThemeId = 'A'

export function getThemeById(themeId: ThemeId): ThemeDefinition {
	return themes[themeId] ?? themes[DEFAULT_THEME_ID]
}

export function listThemes(): ThemeDefinition[] {
	return Object.values(themes)
}


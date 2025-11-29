export type ThemeId = 'A' | 'B' | 'C' | 'D' | 'E'

export interface ThemeDefinition {
	id: ThemeId
	headerBackground: string
	footerBackground: string
	textColor: string
	buttonColor: string
	buttonTextColor: string
	headerFooterTextColor: string
	oddBgColor: string
	evenBgColor: string
	name: string
}

export const themes: Record<ThemeId, ThemeDefinition> = {
	A: {
		id: 'A',
		headerBackground: '#64574E',
		footerBackground: '#64574E',
        headerFooterTextColor: '#ffffff',
		textColor: '#565757',
		buttonColor: '#64574E',
		buttonTextColor: '#ffffff',
		oddBgColor: '#f2f2f2',
		evenBgColor: '#ffffff',
		name: 'Klassisch',
	},
	B: {
		id: 'B',
		headerBackground: '#90C6BF',
		footerBackground: '#90C6BF',
        headerFooterTextColor: '#ffffff',
		buttonColor: '#90C6BF',
		buttonTextColor: '#ffffff',
		textColor: '#565757',
		oddBgColor: '#f2f2f2',
		evenBgColor: '#ffffff',
		name: 'Nordic Breeze',
	},
	C: {
		id: 'C',
		headerBackground: '#FAD857',
		footerBackground: '#FAD857',
        headerFooterTextColor: '#ffffff',
		buttonColor: '#FAD857',
		buttonTextColor: '#ffffff',
		textColor: '#565757',
		oddBgColor: '#f2f2f2',
		evenBgColor: '#ffffff',
		name: 'Sommerlicht',
	},
	D: {
		id: 'D',
		headerBackground: '#A8267D',
		footerBackground: '#A8267D',
        headerFooterTextColor: '#ffffff',
		textColor: '#565757',
		buttonColor: '#A8267D',
		buttonTextColor: '#ffffff',
		oddBgColor: '#f2f2f2',
		evenBgColor: '#ffffff',
		name: 'Beerenzauber',
	},
	E: {
		id: 'E',
		headerBackground: '#46605C',
		footerBackground: '#46605C',
		headerFooterTextColor: '#ffffff',
		textColor: '#ffffff',
		buttonColor: '#46605C',
		buttonTextColor: '#ffffff',
		oddBgColor: '#f2f2f2',
		evenBgColor: '#ffffff',
		name: 'Mineral Green',
	},
}

export const DEFAULT_THEME_ID: ThemeId = 'A'

export function getThemeById(themeId: ThemeId): ThemeDefinition {
	return themes[themeId] ?? themes[DEFAULT_THEME_ID]
}

export function listThemes(): ThemeDefinition[] {
	return Object.values(themes)
}


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
		headerBackground: 'var(--lq-theme-a-primary)',
		footerBackground: 'var(--lq-theme-a-primary)',
		headerFooterTextColor: 'var(--lq-white)',
		textColor: 'var(--lq-text-gray)',
		buttonColor: 'var(--lq-theme-a-primary)',
		buttonTextColor: 'var(--lq-white)',
		oddBgColor: 'var(--lq-bg-gray)',
		evenBgColor: 'var(--lq-white)',
		name: 'Klassisch',
	},
	B: {
		id: 'B',
		headerBackground: 'var(--lq-theme-b-primary)',
		footerBackground: 'var(--lq-theme-b-primary)',
		headerFooterTextColor: 'var(--lq-white)',
		buttonColor: 'var(--lq-theme-b-primary)',
		buttonTextColor: 'var(--lq-white)',
		textColor: 'var(--lq-text-gray)',
		oddBgColor: 'var(--lq-bg-gray)',
		evenBgColor: 'var(--lq-white)',
		name: 'Nordic Breeze',
	},
	C: {
		id: 'C',
		headerBackground: 'var(--lq-theme-c-primary)',
		footerBackground: 'var(--lq-theme-c-primary)',
		headerFooterTextColor: 'var(--lq-white)',
		buttonColor: 'var(--lq-theme-c-primary)',
		buttonTextColor: 'var(--lq-white)',
		textColor: 'var(--lq-text-gray)',
		oddBgColor: 'var(--lq-bg-gray)',
		evenBgColor: 'var(--lq-white)',
		name: 'Sommerlicht',
	},
	D: {
		id: 'D',
		headerBackground: 'var(--lq-theme-d-primary)',
		footerBackground: 'var(--lq-theme-d-primary)',
		headerFooterTextColor: 'var(--lq-white)',
		textColor: 'var(--lq-text-gray)',
		buttonColor: 'var(--lq-theme-d-primary)',
		buttonTextColor: 'var(--lq-white)',
		oddBgColor: 'var(--lq-bg-gray)',
		evenBgColor: 'var(--lq-white)',
		name: 'Beerenzauber',
	},
	E: {
		id: 'E',
		headerBackground: 'var(--lq-theme-e-primary)',
		footerBackground: 'var(--lq-theme-e-primary)',
		headerFooterTextColor: 'var(--lq-white)',
		textColor: 'var(--lq-white)',
		buttonColor: 'var(--lq-theme-e-primary)',
		buttonTextColor: 'var(--lq-white)',
		oddBgColor: 'var(--lq-bg-gray)',
		evenBgColor: 'var(--lq-white)',
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


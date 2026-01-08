'use client'

import { theme } from '@/themes'
import type { ThemeDefinition } from '@/themes'

export interface UseThemeResult {
	theme: ThemeDefinition
	availableThemes: ThemeDefinition[]
	setThemeId: (themeId: string) => void
}

export function useTheme(): UseThemeResult {
	return {
		theme,
		availableThemes: [theme],
		setThemeId: () => {
			console.warn('Theming is now static. setThemeId has no effect.')
		},
	}
}

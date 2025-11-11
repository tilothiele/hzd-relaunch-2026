'use client'

import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_THEME_ID, getThemeById, listThemes } from '@/themes'
import type { ThemeDefinition, ThemeId } from '@/themes'

const STORAGE_KEY = 'hzd-theme'

interface UseThemeOptions {
	initialThemeId?: ThemeId
	persist?: boolean
}

export interface UseThemeResult {
	theme: ThemeDefinition
	themeId: ThemeId
	availableThemes: ThemeDefinition[]
	setThemeId: (themeId: ThemeId) => void
}

export function useTheme(options: UseThemeOptions = {}): UseThemeResult {
	const { initialThemeId = DEFAULT_THEME_ID, persist = true } = options
	const [themeId, setThemeIdState] = useState<ThemeId>(initialThemeId)

	useEffect(() => {
		if (!persist) {
			return
		}

		try {
			const storedThemeId = localStorage.getItem(STORAGE_KEY) as ThemeId | null

			if (storedThemeId) {
				setThemeIdState(storedThemeId)
			}
		} catch (error) {
			console.error('Konnte gespeichertes Theme nicht laden.', error)
		}
	}, [persist])

	const setThemeId = (id: ThemeId) => {
		setThemeIdState(id)
		if (persist) {
			try {
				localStorage.setItem(STORAGE_KEY, id)
			} catch (error) {
				console.error('Theme konnte nicht gespeichert werden.', error)
			}
		}
	}

	const theme = useMemo(() => getThemeById(themeId), [themeId])
	const availableThemes = useMemo(() => listThemes(), [])

	return {
		theme,
		themeId,
		availableThemes,
		setThemeId,
	}
}






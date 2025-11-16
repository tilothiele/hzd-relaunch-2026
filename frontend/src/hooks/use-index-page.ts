'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_INDEX_PAGE, GET_LAYOUT } from '@/lib/graphql/queries'
import { useConfig } from '@/hooks/use-config'
import type { GlobalLayout, StartpageSection } from '@/types'

interface IndexPageData {
	indexPage: {
		Sections?: StartpageSection[] | null
	}
}

interface LayoutData {
	globalLayout: GlobalLayout
}

type StatusType = 'loading' | 'error' | 'empty' | null

interface StatusState {
	type: StatusType
	message: string | null
}

export interface IndexPage {
	globalLayout: GlobalLayout | null
	baseUrl: string | null
	isLoading: boolean
	error: Error | null
	status: StatusState
}

export function useIndexPage(): IndexPage {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const [globalLayout, setGlobalLayout] = useState<GlobalLayout | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const baseUrl = config.strapiBaseUrl

	const loadIndexPage = useCallback(async (resolvedBaseUrl?: string | null) => {
		try {
			setIsLoading(true)
			const [layoutData, indexPageData] = await Promise.all([
				fetchGraphQL<LayoutData>(
					GET_LAYOUT,
					{ baseUrl: resolvedBaseUrl ?? baseUrl },
				),
				fetchGraphQL<IndexPageData>(
					GET_INDEX_PAGE,
					{ baseUrl: resolvedBaseUrl ?? baseUrl },
				),
			])

			// Kombiniere Layout-Daten mit Sections aus indexPage
			const combinedLayout: GlobalLayout = {
				...layoutData.globalLayout,
				Sections: indexPageData.indexPage.Sections ?? null,
			}

			setGlobalLayout(combinedLayout)
			setError(null)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('IndexPage konnte nicht geladen werden.')
			setError(fetchError)
			setGlobalLayout(null)
		} finally {
			setIsLoading(false)
		}
	}, [baseUrl])

	useEffect(() => {
		if (!baseUrl || baseUrl.trim().length === 0) {
			return
		}

		void loadIndexPage(baseUrl)
	}, [baseUrl, loadIndexPage])

	const isBusy = isConfigLoading || isLoading

	const status = useMemo<StatusState>(() => {
		if (!baseUrl) {
			if (configError) {
				return {
					type: 'error',
					message: 'Konfiguration konnte nicht geladen werden.',
				}
			}

			return {
				type: 'loading',
				message: null,
			}
		}

		if (isBusy) {
			return {
				type: 'loading',
				message: null,
			}
		}

		if (configError) {
			return {
				type: 'error',
				message: 'Konfiguration konnte nicht geladen werden.',
			}
		}

		if (error) {
			return {
				type: 'error',
				message: error.message ?? 'IndexPage konnte nicht geladen werden.',
			}
		}

		if (!globalLayout) {
			return {
				type: 'empty',
				message:
					'Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.',
			}
		}

		return {
			type: null,
			message: null,
		}
	}, [baseUrl, configError, error, isBusy, globalLayout])

	return useMemo(() => ({
		globalLayout,
		baseUrl: baseUrl ?? null,
		isLoading: isBusy,
		error: configError ?? error,
		status,
	}), [globalLayout, baseUrl, isBusy, configError, error, status])
}

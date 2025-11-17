'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_LAYOUT } from '@/lib/graphql/queries'
import { useConfig } from '@/hooks/use-config'
import type { GlobalLayout } from '@/types'

interface LayoutData {
	globalLayout: GlobalLayout
}

export function useGlobalLayout() {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const [globalLayout, setGlobalLayout] = useState<GlobalLayout | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const baseUrl = config.strapiBaseUrl

	const loadGlobalLayout = useCallback(async (resolvedBaseUrl?: string | null) => {
		try {
			setIsLoading(true)
			const data = await fetchGraphQL<LayoutData>(
				GET_LAYOUT,
				{ baseUrl: resolvedBaseUrl ?? baseUrl },
			)
			setGlobalLayout(data.globalLayout)
			setError(null)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('GlobalLayout konnte nicht geladen werden.')
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

		void loadGlobalLayout(baseUrl)
	}, [baseUrl, loadGlobalLayout])

	const isBusy = isConfigLoading || isLoading

	return {
		globalLayout,
		isLoading: isBusy,
		error: configError ?? error,
		baseUrl,
	}
}


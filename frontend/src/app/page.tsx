'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_STARTPAGE } from '@/lib/graphql/queries'
import { HomePageContent } from './home-page-content'
import { useConfig } from '@/hooks/use-config'
import type { Startpage } from '@/types'

interface StartpageData {
	startpage: Startpage
}

export default function Home() {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const [startpage, setStartpage] = useState<Startpage | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const baseUrl = config.strapiBaseUrl

	const loadStartpage = useCallback(async (resolvedBaseUrl?: string | null) => {
		try {
			setIsLoading(true)
			const data = await fetchGraphQL<StartpageData>(
				GET_STARTPAGE,
				{ baseUrl: resolvedBaseUrl ?? baseUrl },
			)
			setStartpage(data.startpage)
			setError(null)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Startpage konnte nicht geladen werden.')
			setError(fetchError)
			setStartpage(null)
		} finally {
			setIsLoading(false)
		}
	}, [baseUrl])

	useEffect(() => {
		if (!baseUrl || baseUrl.trim().length === 0) {
			return
		}

		void loadStartpage(baseUrl)
	}, [baseUrl, loadStartpage])

	const isBusy = isConfigLoading || isLoading

	const statusMessage = useMemo(() => {
		if (!baseUrl) {
			if (configError) {
				return 'Konfiguration konnte nicht geladen werden.'
			}

			return 'Konfiguration wird geladen...'
		}

		if (isBusy) {
			return 'Lade Inhalte...'
		}

		if (configError) {
			return 'Konfiguration konnte nicht geladen werden.'
		}

		if (error) {
			return error.message ?? 'Startpage konnte nicht geladen werden.'
		}

		if (!startpage) {
			return 'Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.'
		}

		return null
	}, [configError, error, isBusy, startpage])

	if (statusMessage) {
		if (startpage && baseUrl && !isBusy && !error && !configError) {
			return <HomePageContent homepage={startpage!} strapiBaseUrl={baseUrl} />
		}

		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{statusMessage}</p>
			</div>
		)
	}

	return <HomePageContent homepage={startpage!} strapiBaseUrl={baseUrl!} />
}

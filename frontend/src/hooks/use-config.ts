'use client'

import { useEffect, useState } from 'react'

interface ConfigResponse {
	strapiBaseUrl?: string
}

export function useConfig() {
	const [config, setConfig] = useState<ConfigResponse>({})
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		let isMounted = true

		const loadConfig = async () => {
			try {
				setIsLoading(true)
				const response = await fetch('/api/config', { cache: 'no-store' })

				if (!response.ok) {
					throw new Error(`Konfigurationsabruf fehlgeschlagen: ${response.status}`)
				}

				const data = (await response.json()) as ConfigResponse

				if (!data?.strapiBaseUrl) {
					throw new Error('Konfiguration unvollständig: strapiBaseUrl fehlt')
				}

				if (isMounted) {
					setConfig({ strapiBaseUrl: data.strapiBaseUrl })
					setError(null)
				}
			} catch (err) {
				console.error('Konfiguration konnte nicht geladen werden.', err)
				if (isMounted) {
					setConfig({})
					setError(err instanceof Error ? err : new Error('Unbekannter Fehler'))
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		void loadConfig()

		return () => {
			isMounted = false
		}
	}, [])

	return {
		config,
		isLoading,
		error,
	}
}


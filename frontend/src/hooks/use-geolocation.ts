'use client'

import { useEffect, useState } from 'react'
import type { GeoLocation } from '@/types'

interface UseGeolocationResult {
	location: GeoLocation | null
	zip: string | null
	isLoading: boolean
	error: Error | null
}

/**
 * Hook zur Ermittlung der Geolocation aus der IP-Adresse
 */
export function useGeolocation(): UseGeolocationResult {
	const [location, setLocation] = useState<GeoLocation | null>(null)
	const [zip, setZip] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		let isMounted = true

		const fetchGeolocation = async () => {
			try {
				setIsLoading(true)
				setError(null)

				const response = await fetch('/api/geolocation', {
					cache: 'no-store',
				})

				if (!response.ok) {
					throw new Error('Geolocation-Anfrage fehlgeschlagen')
				}

				const data = await response.json()

				if (data.success && data.lat && data.lng) {
					if (isMounted) {
						setLocation({
							lat: data.lat,
							lng: data.lng,
						})
						if (data.zip) {
							setZip(data.zip)
						}
					}
				} else {
					if (isMounted) {
						setError(new Error(data.message || 'Geolocation konnte nicht ermittelt werden'))
					}
				}
			} catch (err) {
				console.error('Geolocation konnte nicht geladen werden:', err)
				if (isMounted) {
					setError(err instanceof Error ? err : new Error('Unbekannter Fehler'))
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		void fetchGeolocation()

		return () => {
			isMounted = false
		}
	}, [])

	return {
		location,
		zip,
		isLoading,
		error,
	}
}


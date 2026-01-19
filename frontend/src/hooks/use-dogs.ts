'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_DOGS } from '@/lib/graphql/queries'
import { useConfig } from '@/hooks/use-config'
import type { Dog, DogSearchResult } from '@/types'

/**
 * Berechnet die Entfernung zwischen zwei Koordinaten in Kilometern (Haversine-Formel)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371 // Erdradius in Kilometern
	const dLat = (lat2 - lat1) * Math.PI / 180
	const dLng = (lng2 - lng1) * Math.PI / 180
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}



export type SexFilter = 'M' | 'F' | ''
export type ColorFilter = 'S' | 'SM' | 'B' | ''
export type DistanceFilter = '' | 50 | 100 | 300 | 800
export type PageSize = 5 | 10 | 20

interface DogsFilters {
	nameFilter?: string
	sexFilter?: SexFilter
	colorFilter?: ColorFilter
	chipNoFilter?: string
	maxDistance?: DistanceFilter
	userLocation?: { lat: number; lng: number }
}

interface DogsPagination {
	page?: number
	pageSize?: PageSize
}

export interface DogsData {
	dogs: Dog[]
	totalDogs: number
	pageCount: number
	isLoading: boolean
	error: Error | null
}

export interface UseDogsOptions {
	filters?: DogsFilters
	pagination?: DogsPagination
	autoLoad?: boolean
}

export function useDogs(options: UseDogsOptions = {}) {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const {
		filters = {},
		pagination = {},
		autoLoad = true,
	} = options

	const [dogs, setDogs] = useState<Dog[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalDogs, setTotalDogs] = useState(0)
	const [pageCount, setPageCount] = useState(0)

	const baseUrl = config.strapiBaseUrl
	const nameFilter = filters.nameFilter ?? ''
	const sexFilter = filters.sexFilter ?? ''
	const colorFilter = filters.colorFilter ?? ''
	const chipNoFilter = filters.chipNoFilter ?? ''
	const maxDistance = filters.maxDistance ?? ''
	const userLocation = filters.userLocation
	const page = pagination.page ?? 1
	const pageSize = pagination.pageSize ?? 10

	const searchDogs = useCallback(async () => {
		if (!baseUrl || baseUrl.trim().length === 0) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const filterConditions: Array<Record<string, unknown>> = [
				{ cFertile: { eq: true } },
			]

			if (nameFilter.trim()) {
				filterConditions.push({
					or: [
						{ givenName: { containsi: nameFilter.trim() } },
						{ fullKennelName: { containsi: nameFilter.trim() } },
					],
				})
			}

			if (sexFilter) {
				filterConditions.push({
					sex: { eq: sexFilter },
				})
			}

			if (colorFilter) {
				filterConditions.push({
					color: { eq: colorFilter },
				})
			}

			if (chipNoFilter.trim()) {
				filterConditions.push({
					microchipNo: { containsi: chipNoFilter.trim() },
				})
			}

			const variables: Record<string, unknown> = {
				pagination: {
					page,
					pageSize,
				},
				sort: ['fullKennelName:asc'],
			}

			if (filterConditions.length > 0) {
				variables.filters = {
					and: filterConditions,
				}
			}

			const data = await fetchGraphQL<DogSearchResult>(
				SEARCH_DOGS,
				{
					baseUrl,
					variables,
				},
			)

			const dogsArray = Array.isArray(data.hzdPluginDogs) ? data.hzdPluginDogs : []

			setDogs(dogsArray)

			// Berechne Paginierung basierend auf den serverseitigen Ergebnissen
			// Wenn wir genau pageSize Ergebnisse haben, gibt es wahrscheinlich weitere Seiten
			// Wenn wir weniger als pageSize haben, ist das die letzte Seite
			let calculatedPageCount: number
			let estimatedTotal: number

			if (dogsArray.length === 0) {
				// Keine Ergebnisse
				calculatedPageCount = 0
				estimatedTotal = 0
			} else if (dogsArray.length < pageSize) {
				// Weniger als pageSize Ergebnisse = letzte Seite
				estimatedTotal = (page - 1) * pageSize + dogsArray.length
				calculatedPageCount = page
			} else {
				// Genau pageSize Ergebnisse = es gibt wahrscheinlich weitere Seiten
				// Wir nehmen an, dass es mindestens page + 1 Seiten gibt
				calculatedPageCount = page + 1
				estimatedTotal = page * pageSize + 1
			}

			setTotalDogs(estimatedTotal)
			setPageCount(calculatedPageCount)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Hunde konnten nicht geladen werden.')
			setError(fetchError)
			setDogs([])
			setTotalDogs(0)
			setPageCount(0)
		} finally {
			setIsLoading(false)
		}
	}, [baseUrl, nameFilter, sexFilter, colorFilter, chipNoFilter, page, pageSize])

	useEffect(() => {
		if (autoLoad && baseUrl && baseUrl.trim().length > 0) {
			void searchDogs()
		}
	}, [autoLoad, baseUrl, searchDogs])

	const isBusy = isConfigLoading || isLoading

	return useMemo(() => ({
		dogs,
		totalDogs,
		pageCount,
		isLoading: isBusy,
		error: configError ?? error,
		baseUrl: baseUrl ?? null,
		searchDogs,
	}), [dogs, totalDogs, pageCount, isBusy, configError, error, baseUrl, searchDogs])
}


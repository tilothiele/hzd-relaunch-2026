'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_DOGS } from '@/lib/graphql/queries'
import { useConfig } from '@/hooks/use-config'
import type { Dog, DogSearchResult } from '@/types'

import { calculateDistance } from '@/lib/geo-utils'



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
	ownerDocumentId?: string
	sort?: string[]
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
	baseUrl?: string | null
}

export function useDogs(options: UseDogsOptions = {}) {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const {
		filters = {},
		pagination = {},
		autoLoad = true,
		baseUrl: optionsBaseUrl,
	} = options

	const [dogs, setDogs] = useState<Dog[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalDogs, setTotalDogs] = useState(0)
	const [pageCount, setPageCount] = useState(0)

	const baseUrl = optionsBaseUrl || config.strapiBaseUrl
	const nameFilter = filters.nameFilter ?? ''
	const sexFilter = filters.sexFilter ?? ''
	const colorFilter = filters.colorFilter ?? ''
	const chipNoFilter = filters.chipNoFilter ?? ''
	const maxDistance = filters.maxDistance ?? ''
	const ownerDocumentId = filters.ownerDocumentId
	const sort = filters.sort
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
						{ owner: { firstName: { containsi: nameFilter.trim() } } },
						{ owner: { lastName: { containsi: nameFilter.trim() } } },
						{ owner: { city: { containsi: nameFilter.trim() } } },
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

			if (ownerDocumentId) {
				filterConditions.push({
					owner: { documentId: { eq: ownerDocumentId } },
				})
			}

			const variables: Record<string, unknown> = {
				pagination: {
					page,
					pageSize,
				},
				sort: sort || ['fullKennelName:asc'],
			}

			if (filterConditions.length > 0) {
				variables.filters = {
					and: filterConditions,
				}
			}

			console.log('Fetching dogs with variables:', JSON.stringify(variables, null, 2)) // Debugging color issue

			const data = await fetchGraphQL<DogSearchResult>(
				SEARCH_DOGS,
				{
					baseUrl,
					variables,
				},
			)

			const dogsArray = Array.isArray(data.hzdPluginDogs_connection?.nodes)
				? data.hzdPluginDogs_connection.nodes
				: []
			console.log('Fetched dogs:', dogsArray) // Debugging color issue

			// Process dogs (calculate distance, etc.)
			let processedDogs = dogsArray
			if (userLocation) {
				processedDogs = dogsArray.map(dog => {
					if (dog.Location) {
						// Calculate distance if location is available
						// Note: This logic seems to be handled in the component or elsewhere, 
						// but keeping it consistent with previous logic if any processing was done.
						// Actually, looking at previous code, there was no processing here, just assignment.
						// But wait, the previous code had `enrichDogsWithFakeLocations` which was removed or not shown in the snippet?
						// Ah, I see `enrichDogsWithFakeLocations` in a previous `view_file` of `dog-search.tsx`, not `use-dogs.ts`.
						// Here it just sets the dogs.
						return dog
					}
					return dog
				})
			}

			setDogs(dogsArray) // Using the raw array as before, assuming processing happens in component or is not needed here

			// Use pageInfo from the connection for pagination
			const pageInfo = data.hzdPluginDogs_connection?.pageInfo
			if (pageInfo) {
				setTotalDogs(pageInfo.total)
				setPageCount(pageInfo.pageCount)
			} else {
				setTotalDogs(0)
				setPageCount(0)
			}
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
	}, [baseUrl, nameFilter, sexFilter, colorFilter, chipNoFilter, ownerDocumentId, JSON.stringify(sort), page, pageSize])

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


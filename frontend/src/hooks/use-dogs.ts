'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { searchDogs as searchDogsApi, fetchBreederCIdsWithNoDogsAvailable } from '@/lib/strapi/api'
import { useConfig } from '@/hooks/use-config'
import type { Dog, DogSearchResult } from '@/types'

import { calculateDistance } from '@/lib/geo-utils'



export type SexFilter = 'M' | 'F' | ''
export type ColorFilter = 'S' | 'SM' | 'B' | ''
export type DistanceFilter = '' | 50 | 100 | 300 | 800
export type PageSize = 5 | 10 | 20
export type HDLevel = 'A1' | 'A2' | 'B1' | 'B2' | ''
export type SOD1Level = 'N_N' | 'N_DM' | 'DM_DM' | ''
export type TriStateFilter = 'true' | 'false' | ''

interface DogsFilters {
	nameFilter?: string
	sexFilter?: SexFilter
	colorFilter?: ColorFilter
	maxDistance?: DistanceFilter
	userLocation?: { lat: number; lng: number }
	ownerDocumentId?: string
	ownerDocumentIds?: string[]
	ownerCIds?: number[]
	breederDocumentId?: string
	cBreederId?: number
	sort?: string[]
	maxAge?: number
	hdFilter?: HDLevel
	genprofilFilter?: SOD1Level
	eyescheckFilter?: TriStateFilter
	heartcheckFilter?: TriStateFilter
	colorcheckFilter?: TriStateFilter
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
	/** Kein API-Aufruf (z. B. Züchter meldet „keine Hunde in der Zucht“) */
	queryDisabled?: boolean
}

export function useDogs(options: UseDogsOptions = {}) {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const {
		filters = {},
		pagination = {},
		autoLoad = true,
		baseUrl: optionsBaseUrl,
		queryDisabled = false,
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
	const maxDistance = filters.maxDistance ?? ''
	const ownerCIds = filters.ownerCIds?.filter((cId) => typeof cId === 'number') ?? []
	const cBreederId = filters.cBreederId
	const sort = filters.sort
	const userLocation = filters.userLocation
	const page = pagination.page ?? 1
	const pageSize = pagination.pageSize ?? 10
	const maxAge = filters.maxAge
	const hdFilter = filters.hdFilter
	const genprofilFilter = filters.genprofilFilter
	const eyescheckFilter = filters.eyescheckFilter
	const heartcheckFilter = filters.heartcheckFilter
	const colorcheckFilter = filters.colorcheckFilter

	const searchDogs = useCallback(async () => {
		if (!baseUrl || baseUrl.trim().length === 0) {
			return
		}

		if (queryDisabled) {
			setError(null)
			setDogs([])
			setTotalDogs(0)
			setPageCount(0)
			setIsLoading(false)
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

			filterConditions.push({
				or: [
					{ Disabled: { eq: false } },
					{ Disabled: { null: true } },
				],
			})


			if (ownerCIds.length > 0) {
				filterConditions.push({
					cOwnerId: { in: ownerCIds },
				})
			} else if (typeof cBreederId === 'number') {
				filterConditions.push({
					cBreederId: { eq: cBreederId },
				})
			} else {
				const excludedBreederCIds = await fetchBreederCIdsWithNoDogsAvailable({ baseUrl })
				if (excludedBreederCIds.length > 0) {
					filterConditions.push({
						or: [
							{ cBreederId: { null: true } },
							{ cBreederId: { notIn: excludedBreederCIds } },
						],
					})
				}
			}

			if (maxAge) {
				const date = new Date()
				date.setFullYear(date.getFullYear() - maxAge)
				const dateString = date.toISOString().split('T')[0]
				filterConditions.push({
					dateOfBirth: { gte: dateString },
				})
			}
 
			if (hdFilter) {
				filterConditions.push({
					HD: { eq: hdFilter },
				})
			}
 
			if (genprofilFilter) {
				filterConditions.push({
					SOD1: { eq: genprofilFilter },
				})
			}
 
			if (eyescheckFilter) {
				filterConditions.push({
					EyesCheck: { eq: eyescheckFilter === 'true' },
				})
			}
 
			if (heartcheckFilter) {
				filterConditions.push({
					HeartCheck: { eq: heartcheckFilter === 'true' },
				})
			}
 
			if (colorcheckFilter) {
				filterConditions.push({
					ColorCheck: { eq: colorcheckFilter === 'true' },
				})
			}

			const data = await searchDogsApi({
				pagination: { page, pageSize },
				sort: sort || ['fullKennelName:asc'],
				...(filterConditions.length > 0
					? { filters: { and: filterConditions } }
					: {}),
			}, { baseUrl })

			const dogsArray = Array.isArray(data.hzdPluginDogs_connection?.nodes)
				? data.hzdPluginDogs_connection.nodes
				: []
			//console.log('Fetched dogs:', dogsArray) // Debugging color issue



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
	}, [baseUrl, nameFilter, sexFilter, colorFilter, ownerCIds.join(','), cBreederId, queryDisabled, JSON.stringify(sort), page, pageSize, maxAge, hdFilter, genprofilFilter, eyescheckFilter, heartcheckFilter, colorcheckFilter])

	useEffect(() => {
		if (autoLoad && !queryDisabled && baseUrl && baseUrl.trim().length > 0) {
			void searchDogs()
		}
	}, [autoLoad, queryDisabled, baseUrl, searchDogs])

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


'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { searchDogs as searchDogsApi } from '@/lib/strapi/api'
import { useConfig } from '@/hooks/use-config'
import type { Dog, DogSearchResult } from '@/types'

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
	/** Kein API-Aufruf (z. B. Züchter meldet „keine Hunde in der Zucht") */
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
			const data = await searchDogsApi(
				{
					name: nameFilter || undefined,
					sex: sexFilter || undefined,
					color: colorFilter || undefined,
					hd: hdFilter || undefined,
					sod1: genprofilFilter || undefined,
					eyesCheck: eyescheckFilter || undefined,
					heartCheck: heartcheckFilter || undefined,
					colorCheck: colorcheckFilter || undefined,
					ownerCIds: ownerCIds.length > 0 ? ownerCIds : undefined,
					cBreederId: typeof cBreederId === 'number' ? cBreederId : undefined,
					maxAge,
					lat: userLocation?.lat,
					lng: userLocation?.lng,
					maxDistance: typeof maxDistance === 'number' ? maxDistance : undefined,
					sort: sort ?? ['fullKennelName:asc'],
					page,
					pageSize,
				},
				{ baseUrl },
			)

			const dogsArray = Array.isArray(data.hzdPluginDogs_connection?.nodes)
				? data.hzdPluginDogs_connection.nodes
				: []
			setDogs(dogsArray)

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
	}, [
		baseUrl,
		nameFilter,
		sexFilter,
		colorFilter,
		ownerCIds.join(','),
		cBreederId,
		queryDisabled,
		JSON.stringify(sort),
		page,
		pageSize,
		maxAge,
		hdFilter,
		genprofilFilter,
		eyescheckFilter,
		heartcheckFilter,
		colorcheckFilter,
		maxDistance,
		userLocation?.lat,
		userLocation?.lng,
	])

	useEffect(() => {
		if (autoLoad && !queryDisabled && baseUrl && baseUrl.trim().length > 0) {
			void searchDogs()
		}
	}, [autoLoad, queryDisabled, baseUrl, searchDogs])

	const isBusy = isConfigLoading || isLoading

	return useMemo(
		() => ({
			dogs,
			totalDogs,
			pageCount,
			isLoading: isBusy,
			error: configError ?? error,
			baseUrl: baseUrl ?? null,
			searchDogs,
		}),
		[dogs, totalDogs, pageCount, isBusy, configError, error, baseUrl, searchDogs],
	)
}

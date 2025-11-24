'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_DOGS } from '@/lib/graphql/queries'
import { useConfig } from '@/hooks/use-config'
import type { Dog, DogSearchResult } from '@/types'

export type SexFilter = 'M' | 'F' | ''
export type ColorFilter = 'S' | 'SM' | 'B' | ''
export type BooleanFilter = true | false | ''
export type PageSize = 5 | 10 | 20

interface DogsFilters {
	nameFilter?: string
	sexFilter?: SexFilter
	colorFilter?: ColorFilter
	chipNoFilter?: string
	sod1testFilter?: BooleanFilter
	hdtestFilter?: BooleanFilter
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
	const sod1testFilter = filters.sod1testFilter ?? ''
	const hdtestFilter = filters.hdtestFilter ?? ''
	const page = pagination.page ?? 1
	const pageSize = pagination.pageSize ?? 10

	const searchDogs = useCallback(async () => {
		if (!baseUrl || baseUrl.trim().length === 0) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const filterConditions: Array<Record<string, unknown>> = []

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

			if (sod1testFilter !== '') {
				if (sod1testFilter === true) {
					// Suche nach explizit "Ja" (true)
					filterConditions.push({
						Sod1Test: { eq: true },
					})
				} else {
					// Suche nach "Nein" (false ODER null/undefined)
					filterConditions.push({
						or: [
							{ Sod1Test: { eq: false } },
							{ Sod1Test: { null: true } },
						],
					})
				}
			}

			if (hdtestFilter !== '') {
				if (hdtestFilter === true) {
					// Suche nach explizit "Ja" (true)
					filterConditions.push({
						HDTest: { eq: true },
					})
				} else {
					// Suche nach "Nein" (false ODER null/undefined)
					filterConditions.push({
						or: [
							{ HDTest: { eq: false } },
							{ HDTest: { null: true } },
						],
					})
				}
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

			// Berechne Paginierung basierend auf den übergebenen Parametern
			// Da die Meta-Informationen nicht in der Antwort enthalten sind,
			// schätzen wir die Gesamtzahl basierend auf der Anzahl der zurückgegebenen Ergebnisse
			// Wenn wir genau pageSize Ergebnisse haben, gibt es wahrscheinlich mehr
			const estimatedTotal = dogsArray.length === pageSize && page > 1
				? page * pageSize + 1
				: dogsArray.length === pageSize
					? page * pageSize
					: (page - 1) * pageSize + dogsArray.length

			const calculatedPageCount = Math.ceil(estimatedTotal / pageSize)

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
	}, [baseUrl, nameFilter, sexFilter, colorFilter, chipNoFilter, sod1testFilter, hdtestFilter, page, pageSize])

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


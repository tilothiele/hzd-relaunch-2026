'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_LITTERS } from '@/lib/graphql/queries'
import { useConfig } from '@/hooks/use-config'
import type { Litter, LitterSearchResult } from '@/types'

export type LitterStatus = 'Planned' | 'Manted' | 'Littered' | 'Closed' | ''
export type PageSize = 5 | 10 | 20 | 50 | 100

interface LittersFilters {
    breederFilter?: string
    motherFilter?: string
    statusFilter?: LitterStatus
    orderLetterFilter?: string
    selectedMaleColors?: string[]
    selectedFemaleColors?: string[]
}

interface LittersPagination {
    page?: number
    pageSize?: PageSize
}

export interface LittersData {
    litters: Litter[]
    totalLitters: number
    pageCount: number
    isLoading: boolean
    error: Error | null
}

export interface UseLittersOptions {
    filters?: LittersFilters
    pagination?: LittersPagination
    autoLoad?: boolean
}

export function useLitters(options: UseLittersOptions = {}) {
    const { config, isLoading: isConfigLoading, error: configError } = useConfig()
    const {
        filters = {},
        pagination = {},
        autoLoad = true,
    } = options

    const [litters, setLitters] = useState<Litter[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [totalLitters, setTotalLitters] = useState(0)
    const [pageCount, setPageCount] = useState(0)

    const baseUrl = config.strapiBaseUrl
    const breederFilter = filters.breederFilter ?? ''
    const motherFilter = filters.motherFilter ?? ''
    const statusFilter = filters.statusFilter ?? ''
    const orderLetterFilter = filters.orderLetterFilter ?? ''
    const selectedMaleColors = filters.selectedMaleColors ?? []
    const selectedFemaleColors = filters.selectedFemaleColors ?? []
    const page = pagination.page ?? 1
    const pageSize = pagination.pageSize ?? 10

    const searchLitters = useCallback(async () => {
        if (!baseUrl || baseUrl.trim().length === 0) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const filterConditions: Array<Record<string, unknown>> = []

            if (breederFilter.trim()) {
                filterConditions.push({
                    breeder: {
                        kennelName: { containsi: breederFilter.trim() },
                    },
                })
            }

            if (motherFilter.trim()) {
                filterConditions.push({
                    or: [
                        { mother: { fullKennelName: { containsi: motherFilter.trim() } } },
                        { mother: { givenName: { containsi: motherFilter.trim() } } },
                    ],
                })
            }

            if (statusFilter) {
                filterConditions.push({
                    LitterStatus: { eq: statusFilter },
                })
            }

            if (orderLetterFilter) {
                filterConditions.push({
                    OrderLetter: { eq: orderLetterFilter },
                })
            }

            // Farben nur filtern, wenn Status "Geworfen" ist
            if (statusFilter === 'Littered') {
                if (selectedMaleColors.length > 0) {
                    const colorFilters = selectedMaleColors.map((color: string) => ({
                        [`AmountR${color}`]: { Available: { gt: 0 } }
                    }))
                    filterConditions.push({ or: colorFilters })
                }

                if (selectedFemaleColors.length > 0) {
                    const colorFilters = selectedFemaleColors.map((color: string) => ({
                        [`AmountH${color}`]: { Available: { gt: 0 } }
                    }))
                    filterConditions.push({ or: colorFilters })
                }
            }

            const variables: Record<string, unknown> = {
                pagination: {
                    page,
                    pageSize,
                },
                sort: ['dateOfBirth:desc', 'expectedDateOfBirth:desc'],
            }

            if (filterConditions.length > 0) {
                variables.filters = {
                    and: filterConditions,
                }
            }

            const data = await fetchGraphQL<LitterSearchResult>(
                SEARCH_LITTERS,
                {
                    baseUrl,
                    variables,
                },
            )

            const littersArray = Array.isArray(data.hzdPluginLitters_connection?.nodes)
                ? data.hzdPluginLitters_connection.nodes
                : []
            setLitters(littersArray)

            // Use pageInfo from the connection for pagination
            const pageInfo = data.hzdPluginLitters_connection?.pageInfo
            if (pageInfo) {
                setTotalLitters(pageInfo.total)
                setPageCount(pageInfo.pageCount)
            } else {
                setTotalLitters(0)
                setPageCount(0)
            }
        } catch (err) {
            const fetchError = err instanceof Error
                ? err
                : new Error('Würfe konnten nicht geladen werden.')
            setError(fetchError)
            setLitters([])
            setTotalLitters(0)
            setPageCount(0)
        } finally {
            setIsLoading(false)
        }
    }, [baseUrl, breederFilter, motherFilter, statusFilter, orderLetterFilter, selectedMaleColors, selectedFemaleColors, page, pageSize])

    useEffect(() => {
        if (autoLoad && baseUrl && baseUrl.trim().length > 0) {
            void searchLitters()
        }
    }, [autoLoad, baseUrl, searchLitters])

    const isBusy = isConfigLoading || isLoading

    return useMemo(() => ({
        litters,
        totalLitters,
        pageCount,
        isLoading: isBusy,
        error: configError ?? error,
        baseUrl: baseUrl ?? null,
        searchLitters,
    }), [litters, totalLitters, pageCount, isBusy, configError, error, baseUrl, searchLitters])
}

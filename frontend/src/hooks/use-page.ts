'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { notFound } from 'next/navigation'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_PAGE_BY_SLUG, GET_LAYOUT } from '@/lib/graphql/queries'
import { useConfig } from '@/hooks/use-config'
import type { GlobalLayout, Page } from '@/types'

interface PageQueryResult {
	pages?: Page[] | null
}

interface LayoutData {
	globalLayout: GlobalLayout
}

type StatusType = 'loading' | 'error' | 'empty' | null

interface StatusState {
	type: StatusType
	message: string | null
}

async function loadPageBySlug(rawSlug: string, baseUrl: string) {
	const slug = `/${rawSlug}`
	console.log('loadPageBySlug', slug, baseUrl)
	const { pages } = await fetchGraphQL<PageQueryResult>(
		GET_PAGE_BY_SLUG,
		{
			baseUrl,
			variables: { slug },
		},
	)

	console.log('pages', pages)
	const matchingPage = pages?.find((entity) => {
		const entitySlug = entity?.slug
		return entitySlug?.toLowerCase() === slug.toLowerCase()
	})

	console.log('matchingPage', matchingPage)

	return matchingPage ?? null
}



export interface PageData {
	page: Page | null
	globalLayout: GlobalLayout | null
	baseUrl: string | null
	isLoading: boolean
	error: Error | null
	status: StatusState
}

export function usePage(params: Promise<{ slug: string }>): PageData {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const [page, setPage] = useState<Page | null>(null)
	const [globalLayout, setGlobalLayout] = useState<GlobalLayout | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [slug, setSlug] = useState<string | null>(null)

	useEffect(() => {
		async function resolveParams() {
			const { slug: rawSlug } = await params
			if (!rawSlug || rawSlug.trim().length === 0) {
				notFound()
				return
			}
			setSlug(rawSlug.trim())
		}
		void resolveParams()
	}, [params])

	const baseUrl = config.strapiBaseUrl
	const normalizedSlug = slug ?? ''

	const loadPage = useCallback(async (resolvedBaseUrl?: string) => {
		if (!normalizedSlug) {
			return
		}

		try {
			setIsLoading(true)
			const [pageData, layoutData] = await Promise.all([
				loadPageBySlug(normalizedSlug, resolvedBaseUrl ?? baseUrl ?? ''),
				fetchGraphQL<LayoutData>(
					GET_LAYOUT,
					{ baseUrl: resolvedBaseUrl ?? baseUrl ?? '' },
				),
			])

			setPage(pageData)
			setGlobalLayout(layoutData.globalLayout)
			setError(null)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Seite konnte nicht geladen werden.')
			setError(fetchError)
			setPage(null)
			setGlobalLayout(null)
		} finally {
			setIsLoading(false)
		}
	}, [baseUrl, normalizedSlug])

	useEffect(() => {
		if (!baseUrl || baseUrl.trim().length === 0 || !normalizedSlug) {
			return
		}

		void loadPage(baseUrl)
	}, [baseUrl, loadPage, normalizedSlug])

	const isBusy = isConfigLoading || isLoading

	const status = useMemo<StatusState>(() => {
		if (!baseUrl) {
			if (configError) {
				return {
					type: 'error',
					message: 'Konfiguration konnte nicht geladen werden.',
				}
			}

			return {
				type: 'loading',
				message: null,
			}
		}

		if (isBusy) {
			return {
				type: 'loading',
				message: null,
			}
		}

		if (configError) {
			return {
				type: 'error',
				message: 'Konfiguration konnte nicht geladen werden.',
			}
		}

		if (error) {
			return {
				type: 'error',
				message: error.message ?? 'Seite konnte nicht geladen werden.',
			}
		}

		if (!page ) {
			return {
				type: 'empty',
				message:
					'Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.',
			}
		}

		return {
			type: null,
			message: null,
		}
	}, [baseUrl, configError, error, isBusy, page])

	return useMemo(() => ({
		page,
		globalLayout,
		baseUrl: baseUrl ?? null,
		isLoading: isBusy,
		error: configError ?? error,
		status,
	}), [page, globalLayout, baseUrl, isBusy, configError, error, status])
}


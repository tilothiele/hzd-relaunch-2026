'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@chakra-ui/react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { useConfig } from '@/hooks/use-config'
import { notFound } from 'next/navigation'
import { GET_PAGE_BY_SLUG } from '@/lib/graphql/queries'
import { PageContent } from '@/components/pages/page-content'
import type { Page } from '@/types'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

interface PageQueryResult {
	pages?: Page[] | null
}


async function loadPageBySlug(slug: string, baseUrl: string) {
	const { pages} = await fetchGraphQL<PageQueryResult>(
		GET_PAGE_BY_SLUG,
		{
			baseUrl,
			variables: { slug },
		},
	)

	const matchingPage = pages?.find((entity) => {
		const entitySlug = entity?.slug
		return entitySlug?.toLowerCase() === slug.toLowerCase()
	})

	return matchingPage ?? null
}

type StatusType = 'loading' | 'error' | 'empty' | null

const textSkeletonKeys = [
	'text-primary',
	'text-secondary',
	'text-tertiary',
	'text-quaternary',
] as const

interface StatusState {
	type: StatusType
	message: string | null
}

function HomePageSkeleton() {
	return (
		<div
			className='flex min-h-screen flex-col gap-8 px-4 py-12'
			aria-busy='true'
			aria-live='polite'
		>
			<Skeleton height='5rem' borderRadius='md' />
			<div className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
				<Skeleton height='20rem' borderRadius='md' />
				<div className='flex flex-col gap-4'>
					<Skeleton height='3.5rem' borderRadius='md' />
					<Skeleton height='3.5rem' borderRadius='md' />
					<Skeleton height='3.5rem' borderRadius='md' />
				</div>
			</div>
			<Skeleton height='12rem' borderRadius='md' />
			<div className='flex flex-col gap-4'>
				{textSkeletonKeys.map((key) => (
					<Skeleton
						key={key}
						height='1.25rem'
						borderRadius='md'
					/>
				))}
			</div>
		</div>
	)
}

export default function Page({ params }: PageProps) {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const [page, setPage] = useState<Page | null>(null)
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
			const page = await loadPageBySlug(normalizedSlug, resolvedBaseUrl ?? baseUrl ?? '')

			setPage(page)
			setError(null)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Startpage konnte nicht geladen werden.')
			setError(fetchError)
			setPage(null)
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
				message: error.message ?? 'Startpage konnte nicht geladen werden.',
			}
		}

		if (!page) {
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

	if (status.type === 'loading' || !baseUrl) {
		return <HomePageSkeleton />
	}

	if (status.type) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{status.message}</p>
			</div>
		)
	}

	if (!page) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>Seite nicht gefunden</p>
			</div>
		)
	}

	return <PageContent page={page} strapiBaseUrl={baseUrl}/>

}

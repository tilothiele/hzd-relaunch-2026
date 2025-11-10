'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@chakra-ui/react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_STARTPAGE } from '@/lib/graphql/queries'
import { HomePageContent } from './home-page-content'
import { useConfig } from '@/hooks/use-config'
import type { Startpage } from '@/types'

interface StartpageData {
	startpage: Startpage
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

export default function Home() {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const [startpage, setStartpage] = useState<Startpage | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const baseUrl = config.strapiBaseUrl

	const loadStartpage = useCallback(async (resolvedBaseUrl?: string | null) => {
		try {
			setIsLoading(true)
			const data = await fetchGraphQL<StartpageData>(
				GET_STARTPAGE,
				{ baseUrl: resolvedBaseUrl ?? baseUrl },
			)
			setStartpage(data.startpage)
			setError(null)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Startpage konnte nicht geladen werden.')
			setError(fetchError)
			setStartpage(null)
		} finally {
			setIsLoading(false)
		}
	}, [baseUrl])

	useEffect(() => {
		if (!baseUrl || baseUrl.trim().length === 0) {
			return
		}

		void loadStartpage(baseUrl)
	}, [baseUrl, loadStartpage])

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

		if (!startpage) {
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
	}, [baseUrl, configError, error, isBusy, startpage])

	if (status.type === 'loading') {
		return <HomePageSkeleton />
	}

	if (status.type) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{status.message}</p>
			</div>
		)
	}

	return <HomePageContent homepage={startpage!} strapiBaseUrl={baseUrl!} />
}

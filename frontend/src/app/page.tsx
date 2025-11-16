'use client'

import { Skeleton } from '@chakra-ui/react'
import { HomePageContent } from './home-page-content'
import { useIndexPage } from '@/hooks/use-index-page'

const textSkeletonKeys = [
	'text-primary',
	'text-secondary',
	'text-tertiary',
	'text-quaternary',
] as const

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
	const indexPage = useIndexPage()
	const { globalLayout, baseUrl, status } = indexPage

	if (status.type === 'loading' || !globalLayout) {
		return <HomePageSkeleton />
	}

	if (status.type) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{status.message}</p>
			</div>
		)
	}

	return <HomePageContent homepage={globalLayout} strapiBaseUrl={baseUrl!} />
}

'use client'

import { Skeleton } from '@chakra-ui/react'
import { PageContent } from '@/components/pages/page-content'
import { usePage } from '@/hooks/use-page'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

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

export default function Page({ params }: PageProps) {
	const pageData = usePage(params)
	const { page, globalLayout, baseUrl, status } = pageData

	if (status.type === 'loading' || !baseUrl || !globalLayout) {
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

	return <PageContent page={page} globalLayout={globalLayout} strapiBaseUrl={baseUrl} />
}

'use client'

import Image from 'next/image'
import { usePage } from '@/hooks/use-page'
import { renderStartpageSections } from '@/components/sections/section-factory'
import { MainPageStructure } from '../main-page-structure'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

function NotFoundSection() {
	return (
		<div className='flex w-full justify-center px-6 py-24'>
			<section className='grid min-h-[50vh] w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2'>
				<div className='flex items-center justify-center px-6' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
					<Image
						src='/static-images/404-not-found-wuff.jpg'
						alt='404 - Seite nicht gefunden'
						width={300}
						height={300}
						className='rounded-lg object-cover'
						unoptimized
					/>
				</div>
				<div className='flex flex-col items-center justify-center gap-6 px-6 text-center md:text-left'>
					<h1 className='text-4xl font-semibold tracking-tight text-neutral-900'>
						Seite nicht gefunden
					</h1>
					<p className='max-w-lg text-base text-neutral-600'>
						Die angeforderte Seite konnte nicht gefunden werden. Bitte prüfen Sie die
						URL oder kehren Sie zur Startseite zurück.
					</p>
				</div>
			</section>
		</div>
	)
}

export default function Page({ params }: PageProps) {
	const pageData = usePage(params)
	const { page, globalLayout, baseUrl, status } = pageData

	if (status.type === 'loading' || !globalLayout || !baseUrl) {
		return <MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl} loading={true}>{null}</MainPageStructure>
	}

	if (status.type === 'error') {
		return (
			<MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl}>
				<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>{status.message}</p>
				</div>
			</MainPageStructure>
		)
	}

	if (!page || status.type === 'empty') {
		return (
			<MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl} pageTitle='404 - Seite nicht gefunden'>
				<NotFoundSection />
			</MainPageStructure>
		)
	}

	const sections = page.Sections || []

	return (
		<MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl} pageTitle={page.title}>
			{renderStartpageSections({ sections, strapiBaseUrl: baseUrl })}
		</MainPageStructure>
	)
}

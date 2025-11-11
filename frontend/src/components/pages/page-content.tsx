'use client'

import type { Page } from '@/types'
import { renderStartpageSections } from '@/components/sections/section-factory'

interface PageContentProps {
	page: Page
	strapiBaseUrl: string
}

export function PageContent({ page, strapiBaseUrl }: PageContentProps) {
	const sections = page.Sections ?? []
	const emptyStateClasses = [
		'flex',
		'min-h-[50vh]',
		'flex-col',
		'items-center',
		'justify-center',
		'gap-4',
		'px-4',
		'py-16',
		'text-center',
	].join(' ')

	if (!sections.length) {
		return (
			<main className={emptyStateClasses}>
				<h1 className='text-3xl font-semibold text-neutral-900'>
					Seite wird vorbereitet
				</h1>
				<p className='max-w-xl text-base text-neutral-600'>
					Für diese Seite sind noch keine Inhalte hinterlegt.
					{' '}
					Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut.
				</p>
			</main>
		)
	}

	return (
		<main className='flex flex-col gap-12 px-4 py-16'>
			{renderStartpageSections({ sections, strapiBaseUrl })}
		</main>
	)
}



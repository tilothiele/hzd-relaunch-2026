import Link from 'next/link'
import type { Metadata } from 'next'
import { MainPageStructure } from '../main-page-structure'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { searchSite } from '@/lib/server/site-search'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { SearchForm } from '@/components/search/search-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Suche',
}

interface SearchPageProps {
	searchParams: Promise<{
		q?: string
		page?: string
	}>
}

function parsePage(value: string | undefined): number {
	const parsed = Number.parseInt(value ?? '1', 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
	const params = await searchParams
	const query = typeof params.q === 'string' ? params.q : ''
	const page = parsePage(params.page)
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const result = await searchSite(query, page)
	const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize))

	if (error) {
		return (
			<MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl}>
				<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>{error.message ?? 'Fehler beim Laden der Seite.'}</p>
				</div>
			</MainPageStructure>
		)
	}

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			pageTitle='Suche'
		>
			<SectionContainer variant='max-width' paddingTop='2rem' paddingBottom='3rem'>
				<div className='flex w-full flex-col gap-8'>
					<div className='flex flex-col gap-4'>
						<h1 className='text-3xl font-semibold' style={{ color: 'var(--color-text-headline)' }}>
							Suche
						</h1>
						<SearchForm initialQuery={result.query} />
					</div>

					{result.error ? (
						<p className='text-sm text-gray-600'>{result.error}</p>
					) : null}

					{result.query && !result.error && result.hits.length === 0 ? (
						<p className='text-sm text-gray-600'>
							Keine Treffer für „{result.query}“.
						</p>
					) : null}

					{result.hits.length > 0 ? (
						<div className='flex flex-col gap-3'>
							<p className='text-sm text-gray-600'>
								{result.total === 1 ? '1 Treffer' : `${result.total} Treffer`} für „{result.query}“
							</p>
							<ul className='flex flex-col gap-4'>
								{result.hits.map((hit) => (
									<li key={hit.id} className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
										<Link href={hit.url} className='flex flex-col gap-1'>
											<span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
												{hit.typeLabel}
											</span>
											<span className='text-xl font-semibold' style={{ color: 'var(--color-text-headline)' }}>
												{hit.title}
											</span>
											{hit.excerpt ? (
												<span className='text-sm text-gray-700'>{hit.excerpt}</span>
											) : null}
										</Link>
									</li>
								))}
							</ul>
							{pageCount > 1 ? (
								<nav className='flex items-center justify-center gap-3' aria-label='Suchergebnisse'>
									{page > 1 ? (
										<Link
											href={`/search?q=${encodeURIComponent(result.query)}&page=${page - 1}`}
											className='rounded border border-gray-300 px-4 py-2 text-sm'
										>
											Zurück
										</Link>
									) : null}
									<span className='text-sm text-gray-600'>
										Seite {page} von {pageCount}
									</span>
									{page < pageCount ? (
										<Link
											href={`/search?q=${encodeURIComponent(result.query)}&page=${page + 1}`}
											className='rounded border border-gray-300 px-4 py-2 text-sm'
										>
											Weiter
										</Link>
									) : null}
								</nav>
							) : null}
						</div>
					) : null}
				</div>
			</SectionContainer>
		</MainPageStructure>
	)
}

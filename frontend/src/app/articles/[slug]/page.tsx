import Image from 'next/image'
import Link from 'next/link'
import { MainPageStructure } from '../../main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { fetchCategoryBySlug, fetchArticlesByCategory } from '@/lib/server/fetch-articles-by-category'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import NotFoundSection from '@/components/sections/not-found-section/not-found-section'
import { ArticleCard } from '@/components/articles/article-card'
import { ArticleListWithToggle } from '@/components/articles/article-list-with-toggle'

export const dynamic = 'force-dynamic'

interface PageProps {
	params: Promise<{
		slug: string
	}>
	searchParams: Promise<{
		page?: string
	}>
}

function Pagination({ currentPage, totalPages, baseUrl }: { currentPage: number; totalPages: number; baseUrl: string }) {
	if (totalPages <= 1) return null

	const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
	const showPages = pages.filter(p => {
		if (p === 1 || p === totalPages) return true
		if (Math.abs(p - currentPage) <= 1) return true
		return false
	})

	return (
		<div className='mt-12 flex items-center justify-center gap-2'>
			{currentPage > 1 && (
				<Link
					href={`${baseUrl}?page=${currentPage - 1}`}
					className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
				>
					Zurück
				</Link>
			)}

			{showPages.map((page, idx) => {
				const prevPage = showPages[idx - 1]
				const showEllipsis = prevPage && page - prevPage > 1

				return (
					<div key={page} className='flex items-center gap-2'>
						{showEllipsis && <span className='text-gray-400'>...</span>}
						<Link
							href={`${baseUrl}?page=${page}`}
							className={`rounded-lg px-4 py-2 text-sm font-medium ${page === currentPage
								? 'bg-blue-600 text-white'
								: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
								}`}
						>
							{page}
						</Link>
					</div>
				)
			})}

			{currentPage < totalPages && (
				<Link
					href={`${baseUrl}?page=${currentPage + 1}`}
					className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
				>
					Weiter
				</Link>
			)}
		</div>
	)
}

export default async function ArticlesCategoryPage({ params, searchParams }: PageProps) {
	const { slug } = await params
	const { page: pageParam } = await searchParams
	const currentPage = pageParam ? parseInt(pageParam, 10) : 1
	const pageSize = 12

	const { globalLayout, baseUrl, error: layoutError } = await fetchGlobalLayout()
	const theme = globalTheme

	// Ensure slug starts with /
	const categorySlug = slug.startsWith('/') ? slug : `/${slug}`

	// Fetch category
	const category = await fetchCategoryBySlug(categorySlug)

	if (!category) {
		return (
			<MainPageStructure
				homepage={globalLayout}
				strapiBaseUrl={baseUrl}
				theme={theme}
				pageTitle='Kategorie nicht gefunden'
			>
				<NotFoundSection />
			</MainPageStructure>
		)
	}

	// Fetch featured articles
	const featuredArticles = await fetchArticlesByCategory({
		categoryId: category.documentId,
		page: 1,
		pageSize: 100, // Get all featured articles
		featuredFilter: true,
	})

	// Fetch non-featured articles for current page
	const articles = await fetchArticlesByCategory({
		categoryId: category.documentId,
		page: currentPage,
		pageSize,
		featuredFilter: false,
	})

	const pageTitle = category.CategoryName || 'Artikel'
	// Note: This is a simplified pagination - ideally we'd get total count from API
	const totalPages = articles.length === pageSize ? currentPage + 1 : currentPage

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle={pageTitle}
		>
			{/* Category Header */}
			<SectionContainer variant='max-width'>
				<div className='py-12'>
					{category.CategoryImage?.url && (
						<div className='relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-lg'>
							<Image
								src={category.CategoryImage.url.startsWith('http')
									? category.CategoryImage.url
									: `${baseUrl}${category.CategoryImage.url}`}
								alt={category.CategoryImage.alternativeText || category.CategoryName || 'Kategoriebild'}
								fill
								className='object-cover'
								priority
								unoptimized
							/>
						</div>
					)}
					<h1 className='text-4xl font-bold text-gray-900 md:text-5xl'>
						{category.CategoryName}
					</h1>
					{category.CategoryDescription && (
						<div
							className='prose prose-xl mx-auto mb-10 max-w-[800px] text-center dark:prose-invert [&_p]:my-2'
							style={{
								color: theme.textColor,
								'--tw-prose-body': theme.textColor,
								'--tw-prose-headings': theme.headlineColor,
							} as React.CSSProperties}
							dangerouslySetInnerHTML={{ __html: category.CategoryDescription }}
						/>
					)}
				</div>
			</SectionContainer>

			{/* Featured Articles */}
			{featuredArticles.length > 0 && (
				<SectionContainer variant='max-width' backgroundColor='#f9fafb'>
					<div className='py-12'>
						{category.FeatureTitle && (
							<h2 className='mb-8 text-3xl font-bold text-gray-900'>
								{category.FeatureTitle}
							</h2>
						)}
						<div className='grid gap-8 md:grid-cols-2'>
							{featuredArticles.map((article) => (
								<ArticleCard
									key={article.documentId}
									article={article}
									strapiBaseUrl={baseUrl}
									featured={true}
								/>
							))}
						</div>
					</div>
				</SectionContainer>
			)}

			{/* All Articles */}
			<SectionContainer variant='max-width'>
				<div className='py-12'>
					<h2 className='mb-8 text-3xl font-bold text-gray-900'>
						Alle Artikel
					</h2>
					{articles.length > 0 ? (
						<>
							<ArticleListWithToggle
								articles={articles}
								strapiBaseUrl={baseUrl}
								theme={theme}
							/>
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								baseUrl={`/articles/${slug}`}
							/>
						</>
					) : (
						<p className='text-center text-gray-600'>
							Keine Artikel in dieser Kategorie gefunden.
						</p>
					)}
				</div>
			</SectionContainer>
		</MainPageStructure>
	)
}

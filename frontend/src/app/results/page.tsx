import { MainPageStructure } from '../main-page-structure'
import { ResultSearch } from '@/components/result-search/result-search'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { SimpleHeroSectionComponent } from '@/components/sections/simple-hero-section/simple-hero-section'

export const dynamic = 'force-dynamic'

export default async function ResultsPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = globalTheme
	const pageTitle = 'Ergebnisse'
	const resultsHeader = globalLayout?.ResultsHeader
		? {
			...globalLayout.ResultsHeader,
			__typename: 'ComponentBlocksSimpleHeroSection' as const,
		}
		: null

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
			theme={theme}
			pageTitle={pageTitle}
		>
			{resultsHeader ? (
				<SimpleHeroSectionComponent
					section={resultsHeader}
					strapiBaseUrl={baseUrl}
					theme={theme}
					logo={globalLayout?.Logo}
				/>
			) : null}
			<SectionContainer variant='max-width'>
				<ResultSearch strapiBaseUrl={baseUrl} theme={theme} />
			</SectionContainer>
		</MainPageStructure>
	)
}

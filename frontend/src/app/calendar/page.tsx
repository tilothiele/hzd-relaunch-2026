import { MainPageStructure } from '../main-page-structure'
import { CalendarSearch } from '@/components/calendar-search/calendar-search'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { SimpleHeroSectionComponent } from '@/components/sections/simple-hero-section/simple-hero-section'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = globalTheme
	const pageTitle = 'Veranstaltungstermine'
	const calendarHeader = globalLayout?.CalendarHeader
		? {
			...globalLayout.CalendarHeader,
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
			{calendarHeader ? (
				<SimpleHeroSectionComponent
					section={calendarHeader}
					strapiBaseUrl={baseUrl}
					theme={theme}
					logo={globalLayout?.Logo}
				/>
			) : null}
			<SectionContainer variant='max-width'>
				<CalendarSearch strapiBaseUrl={baseUrl} theme={theme} />
			</SectionContainer>
		</MainPageStructure>
	)
}

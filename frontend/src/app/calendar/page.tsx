import { MainPageStructure } from '../main-page-structure'
import { CalendarSearch } from '@/components/calendar-search/calendar-search'
import { themes } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { SectionContainer } from '@/components/sections/section-container/section-container'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = themes.B
	const pageTitle = 'Veranstaltungstermine'

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
			<SectionContainer variant='max-width'>
				<CalendarSearch strapiBaseUrl={baseUrl} theme={theme} />
			</SectionContainer>
		</MainPageStructure>
	)
}







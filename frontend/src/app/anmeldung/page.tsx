import { MainPageStructure } from '../main-page-structure'
import { themes } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { SectionContainer } from '@/components/sections/section-container/section-container'

export const dynamic = 'force-dynamic'

export default async function AnmeldungPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = themes.B
	const pageTitle = 'Anmeldung'
	const backgroundColor = theme.evenBgColor

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
			<SectionContainer
				variant='max-width'
				backgroundColor={backgroundColor}
				paddingTop='1em'
				paddingBottom='1em'
			>
				<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>Bitte wählen Sie ein Formular aus.</p>
				</div>
			</SectionContainer>
		</MainPageStructure>
	)
}



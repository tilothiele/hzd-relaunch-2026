import { MainPageStructure } from '../main-page-structure'
import { DogSearch } from '@/components/dog-search/dog-search'
import { themes } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'

export const dynamic = 'force-dynamic'

export default async function StuntDogsPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = themes.B

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
			pageTitle='Deckrüden'
		>
			<DogSearch strapiBaseUrl={baseUrl} sexFilter='M' />
		</MainPageStructure>
	)
}


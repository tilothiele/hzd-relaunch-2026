import { MainPageStructure } from '../main-page-structure'
import { BreederSearch } from '@/components/breeder-search/breeder-search'
import { themes } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'

export default async function BreedersPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = themes.B
	const pageTitle = 'Züchter'

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
			<BreederSearch strapiBaseUrl={baseUrl} />
		</MainPageStructure>
	)
}


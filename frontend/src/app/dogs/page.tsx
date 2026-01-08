import { MainPageStructure } from '../main-page-structure'
import { DogSearch } from '@/components/dog-search/dog-search'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'

export const dynamic = 'force-dynamic'

export default async function DogsPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = globalTheme

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
			pageTitle='Zuchthündinnen'
		>
			<DogSearch
				strapiBaseUrl={baseUrl}
				sexFilter='F'
				hzdSetting={globalLayout?.HzdSetting}
			/>
		</MainPageStructure>
	)
}


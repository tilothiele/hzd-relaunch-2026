import { Suspense } from 'react'
import { MainPageStructure } from '../main-page-structure'
import { StudDogSearch } from '@/components/stud-dog-search/stud-dog-search'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'

export const dynamic = 'force-dynamic'

export default async function StudDogsPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = globalTheme
	const pageTitle = 'Deckrüdenbesitzer'

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
			<Suspense
				fallback={(
					<div className='flex w-full justify-center px-4 py-8 text-sm text-gray-600'>
						Lade Deckrüdenbesitzer...
					</div>
				)}
			>
				<StudDogSearch
					strapiBaseUrl={baseUrl}
					hzdSetting={globalLayout?.HzdSetting}
				/>
			</Suspense>
		</MainPageStructure>
	)
}


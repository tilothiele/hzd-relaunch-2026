import { MainPageStructure } from '../main-page-structure'
import { DogSearch } from '@/components/dog-search/dog-search'
import type { SexFilter } from '@/hooks/use-dogs'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'

export const dynamic = 'force-dynamic'

function parseDogSexQuery(value: string | string[] | undefined): SexFilter {
	const raw = Array.isArray(value) ? value[0] : value
	const normalized = raw?.trim().toUpperCase()
	if (normalized === 'H') {
		return 'F'
	}
	if (normalized === 'R') {
		return 'M'
	}
	return ''
}

interface DogsPageProps {
	searchParams: Promise<{ geschlecht?: string | string[] }>
}

export default async function DogsPage({ searchParams }: DogsPageProps) {
	const { geschlecht } = await searchParams
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
			pageTitle='Unsere Zuchthunde'
		>
			<DogSearch
				strapiBaseUrl={baseUrl}
				hzdSetting={globalLayout?.HzdSetting}
				initialSex={parseDogSexQuery(geschlecht)}
			/>
		</MainPageStructure>
	)
}


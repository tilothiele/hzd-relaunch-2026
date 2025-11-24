import { MainPageStructure } from '../main-page-structure'
import { themes } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { MeinHzdContent } from '@/components/mein-hzd/mein-hzd-content'

export default async function MeinHzdPage() {
	const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
	const theme = themes.A

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
			pageTitle='Mein HZD'
		>
			<MeinHzdContent strapiBaseUrl={baseUrl} />
		</MainPageStructure>
	)
}


import { MainPageStructure } from '../main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { TikPanel } from '@/components/tik/tik-panel'

export const dynamic = 'force-dynamic'

export const metadata = {
	title: 'TIK Panel',
}

export default async function TikPage() {
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
			pageTitle='TIK Panel'
		>
			<TikPanel strapiBaseUrl={baseUrl} />
		</MainPageStructure>
	)
}

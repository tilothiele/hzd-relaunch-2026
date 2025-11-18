'use client'

import { useGlobalLayout } from '@/hooks/use-global-layout'
import { MainPageStructure } from '../main-page-structure'
import { BreederSearch } from '@/components/breeder-search/breeder-search'
import { themes } from '@/themes'

export default function DogsPage() {
	const { globalLayout, isLoading, error, baseUrl } = useGlobalLayout()
	const pageTitle = 'Züchter'
	const theme = themes.B

	return (
		<MainPageStructure homepage={globalLayout} pageTitle={pageTitle} theme={theme} strapiBaseUrl={baseUrl} loading={isLoading}>
			<BreederSearch strapiBaseUrl={baseUrl} />
		</MainPageStructure>
	)
}


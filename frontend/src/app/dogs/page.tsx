'use client'

import { useGlobalLayout } from '@/hooks/use-global-layout'
import { MainPageStructure } from '../main-page-structure'
import { DogSearch } from '@/components/dog-search/dog-search'
import { themes } from '@/themes'
import { useTheme } from '@/hooks/use-theme'

export default function DogsPage() {
	const { globalLayout, isLoading, error, baseUrl } = useGlobalLayout()
	const theme = themes.B
	return (
		<MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl} loading={isLoading} theme={theme} pageTitle='Hunde'>
			<DogSearch strapiBaseUrl={baseUrl} />
		</MainPageStructure>
	)
}


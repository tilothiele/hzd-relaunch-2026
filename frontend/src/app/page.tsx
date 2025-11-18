'use client'

import { MainPageStructure } from './main-page-structure'
import { useIndexPage } from '@/hooks/use-index-page'
import { renderStartpageSections } from '@/components/sections/section-factory'
import { themes } from '@/themes'



export default function Home() {
	const indexPage = useIndexPage()
	const { globalLayout, baseUrl, status } = indexPage
	const sections = indexPage?.globalLayout?.Sections ?? []

	if (status.type) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{status.message}</p>
			</div>
		)
	}

	return <MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl!} theme={themes.A}>
		{renderStartpageSections({ sections, strapiBaseUrl: baseUrl! })}
	</MainPageStructure>
}

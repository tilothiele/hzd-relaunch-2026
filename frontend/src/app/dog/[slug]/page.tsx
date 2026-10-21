import { MainPageStructure } from '../../main-page-structure'
import { DogDetailView } from '@/components/dog-search/dog-detail-view'
import { TrackUmamiEvent } from '@/components/analytics/track-umami-event'
import NotFoundSection from '@/components/sections/not-found-section/not-found-section'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { fetchPublicDog } from '@/lib/strapi/api'
import { getSexLabel } from '@/lib/dog-utils'
import { theme as globalTheme } from '@/themes'
import type { Dog } from '@/types'

export const dynamic = 'force-dynamic'

interface DogPageProps {
	params: Promise<{ slug: string }>
}

export default async function DogPage({ params }: DogPageProps) {
	const { slug } = await params
	const key = decodeURIComponent(slug).trim()
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

	let dog: Dog | null = null
	let loadError: string | null = null
	try {
		dog = key ? await fetchPublicDog(key) : null
	} catch (err) {
		loadError = err instanceof Error
			? err.message
			: 'Fehler beim Laden des Hundes.'
	}

	if (loadError) {
		return (
			<MainPageStructure
				homepage={globalLayout}
				strapiBaseUrl={baseUrl}
				theme={theme}
			>
				<div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
					<p>{loadError}</p>
				</div>
			</MainPageStructure>
		)
	}

	if (!dog) {
		return (
			<MainPageStructure
				homepage={globalLayout}
				strapiBaseUrl={baseUrl}
				theme={theme}
				pageTitle='Hund nicht gefunden'
			>
				<NotFoundSection />
			</MainPageStructure>
		)
	}

	const pageTitle = dog.fullKennelName ?? dog.givenName ?? 'Hund'

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle={pageTitle}
		>
			<TrackUmamiEvent
				eventName='dog-detail-view'
				eventData={{
					FullKennelName: dog.fullKennelName?.trim() || '',
					geschlecht: getSexLabel(dog.sex),
				}}
			/>
			<DogDetailView
				dog={dog}
				strapiBaseUrl={baseUrl}
				hzdSetting={globalLayout?.HzdSetting}
			/>
		</MainPageStructure>
	)
}

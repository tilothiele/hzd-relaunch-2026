import { MainPageStructure } from '../../main-page-structure'
import { BreederDetailView } from '@/components/breeder-search/breeder-detail-view'
import { StudDogDetailView } from '@/components/stud-dog-search/stud-dog-detail-view'
import { TrackUmamiEvent } from '@/components/analytics/track-umami-event'
import NotFoundSection from '@/components/sections/not-found-section/not-found-section'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { fetchPublicBreeder } from '@/lib/strapi/api'
import { resolveBreederContact } from '@/lib/breeder-display-utils'
import { theme as globalTheme } from '@/themes'
import type { Breeder } from '@/types'

export const dynamic = 'force-dynamic'

interface BreederPageProps {
	params: Promise<{ slug: string }>
}

export default async function BreederPage({ params }: BreederPageProps) {
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

	let breeder: Breeder | null = null
	let loadError: string | null = null
	try {
		breeder = key ? await fetchPublicBreeder(key) : null
	} catch (err) {
		loadError = err instanceof Error
			? err.message
			: 'Fehler beim Laden des Eintrags.'
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

	if (!breeder) {
		return (
			<MainPageStructure
				homepage={globalLayout}
				strapiBaseUrl={baseUrl}
				theme={theme}
				pageTitle='Eintrag nicht gefunden'
			>
				<NotFoundSection />
			</MainPageStructure>
		)
	}

	const isStudOwner = breeder.BreederRole === 'S'
	const contact = resolveBreederContact(breeder)
	const pageTitle = isStudOwner
		? (contact.ownerDisplayName || 'Deckrüdenbesitzer')
		: (breeder.kennelName || contact.ownerDisplayName || 'Züchter')

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle={pageTitle}
		>
			<TrackUmamiEvent
				eventName='breeder-detail-view'
				eventData={{
					KennelName: isStudOwner ? '' : (breeder.kennelName?.trim() || ''),
					Rolle: isStudOwner ? 'Deckrüdenbesitzer' : 'Züchter',
				}}
			/>
			{isStudOwner ? (
				<StudDogDetailView
					breeder={breeder}
					strapiBaseUrl={baseUrl}
					hzdSetting={globalLayout?.HzdSetting}
					breederRole='S'
				/>
			) : (
				<BreederDetailView
					breeder={breeder}
					strapiBaseUrl={baseUrl}
					hzdSetting={globalLayout?.HzdSetting}
					breederRole='B'
				/>
			)}
		</MainPageStructure>
	)
}

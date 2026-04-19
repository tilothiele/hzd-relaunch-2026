import { MainPageStructure } from './main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchGraphQLServer, getStrapiBaseUrl } from '@/lib/server/graphql-client'
import { enrichSectionsWithSupplementalDocuments } from '@/lib/server/enrich-supplemental-sections'
import { GET_LAYOUT, GET_ME } from '@/lib/graphql/queries'
import { renderServerSections } from '@/components/sections/server-section-factory'
import type { GlobalLayout } from '@/types'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

interface LayoutData {
	globalLayout: GlobalLayout
	hzdSetting?: GlobalLayout['HzdSetting']
	announcements?: GlobalLayout['announcements']
}

interface MeData {
	me?: {
		documentId: string
	} | null
}

export default async function Home() {
	let globalLayout: GlobalLayout | null = null
	let baseUrl: string = ''
	let error: Error | null = null
	let isAuthenticated = false

	try {
		baseUrl = getStrapiBaseUrl()
		const data = await fetchGraphQLServer<LayoutData>(GET_LAYOUT, { baseUrl })
		globalLayout = data.globalLayout
		if (globalLayout) {
			globalLayout.HzdSetting = data.hzdSetting ?? null
			globalLayout.announcements = data.announcements ?? null
		}

		const cookieStore = await cookies()
		const tokenFromCookie = cookieStore.get('hzd_auth_token')?.value
		const stateFromCookie = cookieStore.get('hzd_auth_state')?.value
		let authToken: string | null = tokenFromCookie ?? null

		if (!authToken && stateFromCookie) {
			try {
				const parsed = JSON.parse(stateFromCookie) as {
					token?: string | { jwt?: string; token?: string } | null
				}
				authToken = typeof parsed.token === 'string'
					? parsed.token
					: (parsed.token?.jwt ?? parsed.token?.token ?? null)
			} catch {
				authToken = null
			}
		}

		if (authToken) {
			const meData = await fetchGraphQLServer<MeData>(GET_ME, {
				baseUrl,
				token: authToken,
			})
			isAuthenticated = Boolean(meData.me?.documentId)
		}
	} catch (err) {
		error = err instanceof Error ? err : new Error('Fehler beim Laden der Seite.')
	}

	const page = isAuthenticated
		? (globalLayout?.authenticated_page ?? globalLayout?.page)
		: globalLayout?.page
	const sections = await enrichSectionsWithSupplementalDocuments(
		page?.Sections ?? [],
		baseUrl,
	)

	if (error) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{error.message ?? 'Fehler beim Laden der Seite.'}</p>
			</div>
		)
	}

	if (!globalLayout) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.</p>
			</div>
		)
	}

	const theme = globalTheme
	const renderedSections = renderServerSections({
		sections,
		strapiBaseUrl: baseUrl,
		theme,
		logo: globalLayout?.Logo,
		hzdSetting: globalLayout?.HzdSetting
	})

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			logoBackground={page?.LogoBackground}
		>
			{renderedSections}
		</MainPageStructure>
	)
}

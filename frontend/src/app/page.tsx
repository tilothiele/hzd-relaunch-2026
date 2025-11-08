import { Footer } from '@/components/footer/footer'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_HOMEPAGE } from '@/lib/graphql/queries'
import { HomePageContent } from './home-page-content'
import type { Startpage } from '@/types'

interface HomePageData {
	startpage: Startpage
}

async function getHomepageData() {
	try {
		const data = await fetchGraphQL<HomePageData>(GET_HOMEPAGE)
		return data.startpage
	} catch (error) {
		console.error('Error fetching homepage:', error)
		return null
	}
}

export default async function Home() {
	const homepage = await getHomepageData()

	if (!homepage) {
		return (
			<div className='flex min-h-screen items-center justify-center'>
				<p className='text-gray-600'>
					Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.
				</p>
			</div>
		)
	}

	return (
		<>
			<HomePageContent homepage={homepage} />
			<Footer startpage={homepage} />
		</>
	)
}

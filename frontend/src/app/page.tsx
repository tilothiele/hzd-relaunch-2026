import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_HOMEPAGE, GET_SECTIONS } from '@/lib/graphql/queries'
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
	const [homepage] = await Promise.all([
		getHomepageData(),
//		getSectionsData(),
	])

	console.log(homepage)

	if (!homepage) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-gray-600">Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.</p>
			</div>
		)
	}

	return (
		<>
			<Header />
			<main>

			</main>
			<Footer />
		</>
	)
}

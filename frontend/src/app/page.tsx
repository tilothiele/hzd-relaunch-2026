import { Header } from '@/components/header/header'
import { Hero } from '@/components/hero/hero'
import { InfoBlocks } from '@/components/info-blocks/info-blocks'
import { WelcomeSection } from '@/components/welcome-section/welcome-section'
import { NewsSection } from '@/components/news-section/news-section'
import { ActiveSection } from '@/components/active-section/active-section'
import { MembershipSection } from '@/components/membership-section/membership-section'
import { Footer } from '@/components/footer/footer'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_HOMEPAGE, GET_NEWS, GET_SECTIONS } from '@/lib/graphql/queries'
import type { Homepage, NewsArticle, HomepageSection } from '@/types'

interface HomePageData {
	hzdPluginHomepage: Homepage
}

interface NewsData {
	hzdPluginNewsArticles: {
		data: NewsArticle[]
	}
}

interface SectionsData {
	hzdPluginHomepageSections: {
		data: HomepageSection[]
	}
}

async function getHomepageData() {
	try {
		const data = await fetchGraphQL<HomePageData>(GET_HOMEPAGE)
		return data.hzdPluginHomepage
	} catch (error) {
		console.error('Error fetching homepage:', error)
		return null
	}
}

async function getNewsData() {
	try {
		const data = await fetchGraphQL<NewsData>(GET_NEWS, { limit: 2, start: 0 })
		return data.hzdPluginNewsArticles.data
	} catch (error) {
		console.error('Error fetching news:', error)
		return []
	}
}

async function getSectionsData() {
	try {
		const data = await fetchGraphQL<SectionsData>(GET_SECTIONS)
		const sections = data.hzdPluginHomepageSections?.data || []
		return sections.sort((a, b) => (a.attributes.order || 0) - (b.attributes.order || 0))
	} catch (error) {
		console.error('Error fetching sections:', error)
		return []
	}
}

export default async function Home() {
	const [homepage, news, sections] = await Promise.all([
		getHomepageData(),
		getNewsData(),
		getSectionsData(),
	])

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
				<Hero homepage={homepage} />
				<InfoBlocks sections={sections} />
				<WelcomeSection homepage={homepage} />
				<NewsSection articles={news} />
				<ActiveSection sections={sections} />
				<MembershipSection homepage={homepage} />
			</main>
			<Footer />
		</>
	)
}

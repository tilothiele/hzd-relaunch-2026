import { fetchGraphQLServer, getStrapiBaseUrl } from './graphql-client'
import { GET_INDEX_PAGE, GET_LAYOUT } from '@/lib/graphql/queries'
import type { GlobalLayout, StartpageSection } from '@/types'

interface IndexPageData {
	indexPage: {
		Sections?: StartpageSection[] | null
	}
}

interface LayoutData {
	globalLayout: GlobalLayout
}

export interface IndexPageResult {
	globalLayout: GlobalLayout | null
	baseUrl: string
	error: Error | null
}

/**
 * Ruft die Index-Page-Daten serverseitig ab.
 * Kombiniert Layout-Daten mit Sections aus der Index-Page.
 */
export async function fetchIndexPage(): Promise<IndexPageResult> {
	try {
		const baseUrl = getStrapiBaseUrl()

		const [layoutData, indexPageData] = await Promise.all([
			fetchGraphQLServer<LayoutData>(GET_LAYOUT, { baseUrl }),
			fetchGraphQLServer<IndexPageData>(GET_INDEX_PAGE, { baseUrl }),
		])

		// Kombiniere Layout-Daten mit Sections aus indexPage
		const combinedLayout: GlobalLayout = {
			...layoutData.globalLayout,
			Sections: indexPageData.indexPage.Sections ?? null,
		}

		return {
			globalLayout: combinedLayout,
			baseUrl,
			error: null,
		}
	} catch (err) {
		const error = err instanceof Error
			? err
			: new Error('IndexPage konnte nicht geladen werden.')

		return {
			globalLayout: null,
			baseUrl: getStrapiBaseUrl(),
			error,
		}
	}
}


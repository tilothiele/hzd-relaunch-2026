import { notFound } from 'next/navigation'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_PAGE_BY_SLUG } from '@/lib/graphql/queries'
import { PageContent } from '@/components/pages/page-content'
import type { Page } from '@/types'

interface PageProps {
	params: Promise<{
		slug: string
	}>
}

interface PageQueryResult {
	pages?: Page[]
}

function resolveStrapiBaseUrl() {
	const envUrl = process.env.STRAPI_BASE_URL

	if (envUrl && envUrl.trim().length > 0) {
		return envUrl.trim()
	}

	return null
}

async function loadPageBySlug(slug: string, baseUrl: string) {
	const data = await fetchGraphQL<PageQueryResult>(
		GET_PAGE_BY_SLUG,
		{
			baseUrl,
			variables: { slug },
		},
	)

	const page = data.pages && data.pages.length > 0 ? data.pages[0] : null

    return page
}

export default async function Page({ params }: PageProps) {
	const { slug: rawSlug } = await params

	if (!rawSlug || rawSlug.trim().length === 0) {
		notFound()
	}

	const baseUrl = resolveStrapiBaseUrl()

	if (!baseUrl) {
		<div></div>
	}

	const normalizedSlug = rawSlug.trim()

	try {
		const page = await loadPageBySlug(normalizedSlug, baseUrl)

        console.log(page)
		if (!page) {
			notFound()
		}

		return (
			<PageContent
				page={page}
				strapiBaseUrl={baseUrl}
			/>
		)
	} catch (error) {
		console.error(
			`Seite für Slug "${normalizedSlug}" konnte nicht geladen werden.`,
			error,
		)
		notFound()
	}
}


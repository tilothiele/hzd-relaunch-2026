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

interface PageEntity {
	id: string
	attributes?: Page | null
}

interface PageQueryResult {
	pages?: {
		data?: PageEntity[] | null
	} | null
}

const FALLBACK_STRAPI_BASE_URL = 'http://localhost:1337'

function resolveStrapiBaseUrl() {
	const envUrl = process.env.STRAPI_BASE_URL

	if (envUrl && envUrl.trim().length > 0) {
		return envUrl.trim()
	}

	return FALLBACK_STRAPI_BASE_URL
}

async function loadPageBySlug(slug: string, baseUrl: string) {
	const data = await fetchGraphQL<PageQueryResult>(
		GET_PAGE_BY_SLUG,
		{
			baseUrl,
			variables: { slug },
		},
	)

	const entities = data.pages?.data ?? []

	const matchingPage = entities.find((entity) => {
		const entitySlug = entity.attributes?.slug
		return entitySlug?.toLowerCase() === slug.toLowerCase()
	})

	return matchingPage?.attributes ?? null
}

export default async function Page({ params }: PageProps) {
	const { slug: rawSlug } = await params

	if (!rawSlug || rawSlug.trim().length === 0) {
		notFound()
	}

	const baseUrl = resolveStrapiBaseUrl()
	const normalizedSlug = rawSlug.trim()

	try {
		const page = await loadPageBySlug(normalizedSlug, baseUrl)

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


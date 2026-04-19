import { getStrapiBaseUrl } from './graphql-client'

const STRAPI_BASE_URL = getStrapiBaseUrl()

const PASSED_DOGS_APPROVED_QUERY = `
	query PassedDogsApprovedPage($pagination: PaginationArg!) {
		passedDogs_connection(
			filters: {
				Approved: { eq: true }
				Consent: { eq: true }
			}
			pagination: $pagination
			sort: ["DatePassed:desc", "publishedAt:desc"]
		) {
			nodes {
				documentId
				DogName
				DatePassed
				Message
				Approved
				Consent
				Avatar {
					url
					alternativeText
					width
					height
				}
				hzd_plugin_dog {
					documentId
					fullKennelName
				}
			}
			pageInfo {
				page
				pageSize
				pageCount
				total
			}
		}
	}
`

export interface PassedDogCardData {
	documentId: string
	DogName?: string | null
	DatePassed?: string | null
	Message?: string | null
	Approved?: boolean | null
	Consent?: boolean | null
	Avatar?: {
		url: string
		alternativeText?: string | null
		width?: number | null
		height?: number | null
	} | null
	hzd_plugin_dog?: {
		documentId: string
		fullKennelName?: string | null
	} | null
}

export interface PassedDogsPageResult {
	nodes: PassedDogCardData[]
	pageInfo: {
		page: number
		pageSize: number
		pageCount: number
		total: number
	}
}

export async function fetchApprovedPassedDogsPage(
	page: number,
	pageSize: number,
): Promise<PassedDogsPageResult> {
	try {
		const response = await fetch(`${STRAPI_BASE_URL}/graphql`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: PASSED_DOGS_APPROVED_QUERY,
				variables: {
					pagination: { page, pageSize },
				},
			}),
			next: { revalidate: 60 },
		})

		const json = await response.json()

		if (json.errors) {
			console.error('fetchApprovedPassedDogsPage:', json.errors)
			return {
				nodes: [],
				pageInfo: { page, pageSize, pageCount: 0, total: 0 },
			}
		}

		const conn = json.data?.passedDogs_connection
		return {
			nodes: conn?.nodes ?? [],
			pageInfo: conn?.pageInfo ?? {
				page,
				pageSize,
				pageCount: 0,
				total: 0,
			},
		}
	} catch (e) {
		console.error('fetchApprovedPassedDogsPage:', e)
		return {
			nodes: [],
			pageInfo: { page, pageSize, pageCount: 0, total: 0 },
		}
	}
}

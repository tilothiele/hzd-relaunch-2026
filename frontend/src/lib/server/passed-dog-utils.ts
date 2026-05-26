import { fetchApprovedPassedDogsPage as fetchApprovedPassedDogsPageApi } from '@/lib/strapi/api'
import { getStrapiBaseUrl } from './strapi-client'

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
	const result = await fetchApprovedPassedDogsPageApi(
		page,
		pageSize,
		getStrapiBaseUrl(),
	)
	return {
		nodes: result.nodes as PassedDogCardData[],
		pageInfo: result.pageInfo,
	}
}

import { fetchApprovedPassedDogsPage as fetchApprovedPassedDogsPageApi } from '@/lib/strapi/api'

export interface PassedDogCardData {
	documentId: string
	DogName?: string | null
	DatePassed?: string | null
	Message?: string | null
	HealthInfo?: string | null
	Approved?: boolean | null
	Consent?: boolean | null
	UserName?: string | null
	EMail?: string | null
	Avatar?: {
		url: string
		alternativeText?: string | null
		width?: number | null
		height?: number | null
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
	)
	return {
		nodes: result.nodes as PassedDogCardData[],
		pageInfo: result.pageInfo,
	}
}

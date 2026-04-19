'use server'

import {
	fetchApprovedPassedDogsPage,
	type PassedDogsPageResult,
} from './passed-dog-utils'

export async function getMoreApprovedPassedDogs(
	page: number,
	pageSize: number,
): Promise<PassedDogsPageResult> {
	return fetchApprovedPassedDogsPage(page, pageSize)
}

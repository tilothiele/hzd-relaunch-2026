import { searchChampions } from '@/lib/strapi/api'
import type { ChampionSearchPageResult } from '@/types'

export async function fetchChampions(
	page = 1,
	pageSize = 20,
): Promise<ChampionSearchPageResult> {
	try {
		return await searchChampions(
			{
				page,
				pageSize,
				sort: 'DateOfChampionship:desc',
			},
			{ server: true },
		)
	} catch (error) {
		console.error('Error fetching champions:', error)
		return {
			nodes: [],
			pageInfo: {
				total: 0,
				page: 1,
				pageSize,
				pageCount: 0,
			},
		}
	}
}

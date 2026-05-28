import { getStrapiBaseUrl } from './strapi-client'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import { fetchEntityList } from '@/lib/strapi/api'

const CHAMPIONS_POPULATE = new URLSearchParams({
	'populate[ChampinAvatar]': '*',
	'populate[hzd_plugin_dog][populate][avatar]': '*',
	'populate[hzd_plugin_dog][populate][owner]': '*',
	'populate[hzd_plugin_dog][populate][breeder][populate][member]': '*',
})

export async function fetchChampions(page = 1, pageSize = 20) {
	try {
		const query = buildStrapiQuery({
			pagination: { page, pageSize },
			sort: ['DateOfChampionship:desc'],
			populate: Object.fromEntries(CHAMPIONS_POPULATE.entries()),
		})

		return await fetchEntityList<Record<string, unknown>>(
			'champions',
			query,
			{ server: true, baseUrl: getStrapiBaseUrl() },
		)
	} catch (error) {
		console.error('Error fetching champions:', error)
		return []
	}
}

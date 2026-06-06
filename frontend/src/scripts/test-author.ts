import { getStrapiBaseUrl } from '../lib/server/strapi-client'
import { buildStrapiQuery } from '../lib/strapi/filters'
import { fetchEntityList } from '../lib/strapi/api'

async function test() {
    try {
        console.log('Fetching author with slug "mareike-busch"')
        const query = buildStrapiQuery({
            filters: { Slug: { eq: 'mareike-busch' } },
            pagination: { pageSize: 1 },
            populate: {
                'populate[Avatar]': '*',
                'populate[ExternalPublication]': '*',
            },
        })
        const result = await fetchEntityList(
            'authors',
            query,
            { server: true },
        )
        console.log(JSON.stringify(result, null, 2))
    } catch (e) {
        console.error('Error fetching:', e)
    }
}

test()

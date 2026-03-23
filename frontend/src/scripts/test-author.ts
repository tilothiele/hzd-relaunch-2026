import { fetchGraphQLServer } from '../lib/server/graphql-client'
import { GET_AUTHOR_BY_SLUG } from '../lib/graphql/queries'

async function test() {
    try {
        console.log('Fetching author with slug "mareike-busch"')
        const result = await fetchGraphQLServer(GET_AUTHOR_BY_SLUG, {
            baseUrl: 'http://127.0.0.1:1337', // Or process.env.NEXT_PUBLIC_STRAPI_URL
            variables: { slug: 'mareike-busch' }
        })
        console.log(JSON.stringify(result, null, 2))
    } catch (e) {
        console.error('Error fetching:', e)
    }
}

test()

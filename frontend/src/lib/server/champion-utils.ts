import { getStrapiBaseUrl } from './graphql-client'

const STRAPI_BASE_URL = getStrapiBaseUrl()

export async function fetchChampions(page = 1, pageSize = 20) {
    try {
        const query = `
        query GetChampions($pagination: PaginationArg) {
            champions(sort: ["DateOfChampionship:desc"], pagination: $pagination) {
                documentId
                ChampionshipName
                DateOfChampionship
                ChampinAvatar {
                    url
                    alternativeText
                    width
                    height
                }
                hzd_plugin_dog {
                    documentId
                    givenName
                    fullKennelName
                    avatar {
                        url
                        alternativeText
                        width
                        height
                    }
                    owner {
                        firstName
                        lastName
                        city
                    }
                    breeder {
                        kennelName
                        member {
                            firstName
                            lastName
                            city
                        }
                    }
                }
            }
        }
        `

        const response = await fetch(`${STRAPI_BASE_URL}/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: {
                    pagination: {
                        page,
                        pageSize
                    }
                }
            }),
            next: { revalidate: 60 }
        })

        const json = await response.json()

        if (json.errors) {
            console.error('Error fetching champions:', json.errors)
            return []
        }

        return json.data?.champions || []
    } catch (error) {
        console.error('Error fetching champions:', error)
        return []
    }
}

// End of file

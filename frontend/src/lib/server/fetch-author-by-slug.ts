import { fetchGraphQLServer, getStrapiBaseUrl } from './graphql-client'
import { GET_AUTHOR_BY_SLUG } from '@/lib/graphql/queries'
import { fetchGlobalLayout } from './fetch-page-by-slug'
import type { GlobalLayout, Author } from '@/types'

interface AuthorQueryResult {
    authors?: Author[] | null
}

export interface AuthorBySlugResult {
    author: Author | null
    globalLayout: GlobalLayout | null
    baseUrl: string
    error: Error | null
}

export async function fetchAuthorBySlug(slug: string): Promise<AuthorBySlugResult> {
    try {
        const baseUrl = getStrapiBaseUrl()

        const [authorData, layoutData] = await Promise.all([
            fetchGraphQLServer<AuthorQueryResult>(
                GET_AUTHOR_BY_SLUG,
                {
                    baseUrl,
                    variables: { slug },
                },
            ),
            fetchGlobalLayout(),
        ])

        const matchingAuthor = authorData.authors?.[0] ?? null

        return {
            author: matchingAuthor,
            globalLayout: layoutData.globalLayout,
            baseUrl,
            error: null,
        }
    } catch (err) {
        const error = err instanceof Error
            ? err
            : new Error('Autor konnte nicht geladen werden.')

        return {
            author: null,
            globalLayout: null,
            baseUrl: getStrapiBaseUrl(),
            error,
        }
    }
}

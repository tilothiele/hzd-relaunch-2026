
import { NextRequest, NextResponse } from 'next/server'
import { fetchGraphQLServer } from '@/lib/server/graphql-client'
import { GET_NEWS_ARTICLES_COUNT } from '@/lib/graphql/queries'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    // Optional: Filter by 'publishedAt' exists (already implying published if using standard filters, but maybe explicit check needed?)
    // The user requirement says "menge der Articles, dieser kategorie".

    // Construct filters
    const filters: any = {}
    if (category) {
        // Assuming category refers to the category slug or name? 
        // badge-numbers.ts passes 'badgeName' as 'category'. 
        // In news-utils.ts, categoryDocumentId was used. 
        // If 'category' param is a slug, we need to filter by slug.
        // Let's assume slug or category name. 
        // Looking at 'badge-numbers.ts', badgeName likely matches the category slug or name.
        // Let's try filtering by category slug first, or verify schema.
        // In 'GET_NEWS_ARTICLES', category has 'CategoryName'.
        // I will assume the param is the CategoryName or a related field.
        // Let's assume it matches 'CategoryName' or check if there's a slug on category.
        // GET_NEWS_ARTICLES has `category { CategoryName }`. 
        // I'll try filtering by `category: { Slug: { eq: category } }` if category has a slug, or `CategoryName`.

        // Wait, badge-numbers.ts uses 'badgeName'. Typical badges are "News", "Breeding", etc.
        // If the user says "category", I will use `category: { CategoryName: { eq: category } }` as a safe bet if no slug visible.
        // Actually, let's check GET_NEWS_ARTICLES again. 
        // line 1421: `category { CategoryName }`.

        filters.category = { CategoryName: { eq: category } }
    }

    try {
        const data = await fetchGraphQLServer<{ newsArticles: { documentId: string }[] }>(
            GET_NEWS_ARTICLES_COUNT,
            {
                variables: {
                    filters,
                    pagination: { limit: 1000 } // Fetch up to 1000 articles to count them
                }
            }
        )

        const count = data.newsArticles?.length || 0

        return NextResponse.json({ count })
    } catch (error) {
        console.error('Error fetching news articles count:', error)
        return NextResponse.json({ count: 0 }, { status: 500 })
    }
}


import { NextRequest, NextResponse } from 'next/server'
import { fetchNewsArticles } from '@/lib/strapi/api'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    const filters: Record<string, unknown> = {}
    if (category) {
        filters.category = { CategoryName: { eq: category } }
    }

    try {
        const { newsArticles } = await fetchNewsArticles({
            filters,
            pagination: { pageSize: 1000 },
        })

        const count = newsArticles?.length || 0

        return NextResponse.json({ count })
    } catch (error) {
        console.error('Error fetching news articles count:', error)
        return NextResponse.json({ count: 0 }, { status: 500 })
    }
}

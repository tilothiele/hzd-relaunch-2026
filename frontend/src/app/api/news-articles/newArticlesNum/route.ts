import { NextRequest, NextResponse } from 'next/server'
import { fetchStrapiServer } from '@/lib/server/strapi-client'
import { buildStrapiQuery } from '@/lib/strapi/filters'
import { extractStrapiPagination } from '@/lib/strapi/normalize'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const category = searchParams.get('category')

	const filters: Record<string, unknown> = {}
	if (category) {
		filters.category = { CategoryName: { eq: category } }
	}

	try {
		// Count only — no deep populate (avoids Strapi "Invalid key true" on DZ fragments).
		const query = buildStrapiQuery({
			filters,
			pagination: { page: 1, pageSize: 1 },
			fields: ['documentId'],
		})
		const response = await fetchStrapiServer<unknown>('news-articles', query)
		const count = extractStrapiPagination(response)?.total ?? 0

		return NextResponse.json({ count })
	} catch (error) {
		console.error('Error fetching news articles count:', error)
		return NextResponse.json({ count: 0 }, { status: 500 })
	}
}

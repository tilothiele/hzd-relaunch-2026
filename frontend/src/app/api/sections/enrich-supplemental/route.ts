import { NextRequest, NextResponse } from 'next/server'
import { enrichSectionsWithSupplementalDocuments } from '@/lib/server/enrich-supplemental-sections'
import { getStrapiPublicBaseUrl } from '@/lib/server/strapi-client'
import type { StartpageSection } from '@/types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json() as {
			sections?: StartpageSection[]
			baseUrl?: string
		}

		if (!Array.isArray(body.sections)) {
			return NextResponse.json(
				{ error: 'sections array is required' },
				{ status: 400 },
			)
		}

		const baseUrl = body.baseUrl?.trim() || getStrapiPublicBaseUrl()
		const enriched = await enrichSectionsWithSupplementalDocuments(
			body.sections,
			baseUrl,
		)

		return NextResponse.json({ sections: enriched })
	} catch (error) {
		console.error('[enrich-supplemental] failed', error)
		return NextResponse.json(
			{ error: 'Supplemental sections could not be enriched' },
			{ status: 500 },
		)
	}
}

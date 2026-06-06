import { NextResponse } from 'next/server'
import { getStrapiPublicBaseUrl } from '@/lib/server/strapi-client'

export const dynamic = 'force-dynamic'

export async function GET() {
	return NextResponse.json({
		strapiBaseUrl: getStrapiPublicBaseUrl(),
	})
}

import { NextResponse } from 'next/server'

const strapiBaseUrl = process.env.STRAPI_BASE_URL || 'http://localhost:1337'

export async function GET() {
	return NextResponse.json({ strapiBaseUrl })
}



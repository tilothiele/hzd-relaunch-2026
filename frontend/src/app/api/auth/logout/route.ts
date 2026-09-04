import { NextResponse } from 'next/server'
import { clearStrapiJwtCookie } from '@/lib/auth-cookie'

export const dynamic = 'force-dynamic'

export async function POST() {
	const response = NextResponse.json({ ok: true })
	return clearStrapiJwtCookie(response)
}

import { NextResponse } from 'next/server'
import { getAltcha } from '@/lib/server/altcha'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
	try {
		const altcha = await getAltcha()
		return altcha.challengeHandler(request)
	} catch (error) {
		console.error('ALTCHA-Challenge konnte nicht erzeugt werden:', error)
		return NextResponse.json(
			{ error: 'Die Bot-Prüfung ist derzeit nicht verfügbar.' },
			{ status: 503 },
		)
	}
}

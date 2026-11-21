import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 * Liveness-Check für Container (Docker/Coolify). Keine Abhängigkeit
 * von Strapi oder der Datenbank: sobald der Server Anfragen annimmt,
 * ist die Antwort 200.
 */
export function GET() {
	return NextResponse.json(
		{ status: 'ok' },
		{
			status: 200,
			headers: {
				'Cache-Control': 'no-store',
			},
		},
	)
}

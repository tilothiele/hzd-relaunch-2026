import { NextRequest, NextResponse } from 'next/server'
import { isTikDenied, requireTikUser } from '@/lib/server/tik-access'
import {
	clampPageSize,
	searchTikPhotoboxCollections,
} from '@/lib/server/tik-photobox'

export const dynamic = 'force-dynamic'

function clampPage(value: string | null): number {
	const parsed = Number(value)
	if (!Number.isInteger(parsed) || parsed < 1) {
		return 1
	}
	return Math.min(parsed, 10000)
}

export async function GET(request: NextRequest) {
	const access = await requireTikUser(request)
	if (isTikDenied(access)) {
		return access
	}

	const params = request.nextUrl.searchParams
	const membershipRaw = params.get('membershipNumber')?.trim() ?? ''
	let membershipNumber: number | null = null

	if (membershipRaw) {
		if (!/^\d+$/.test(membershipRaw)) {
			return NextResponse.json(
				{ message: 'Mitgliedsnummer muss eine Zahl sein.' },
				{ status: 400 },
			)
		}
		membershipNumber = Number(membershipRaw)
	}

	const term = params.get('term')?.trim() || null

	try {
		const result = await searchTikPhotoboxCollections({
			membershipNumber,
			term,
			page: clampPage(params.get('page')),
			pageSize: clampPageSize(params.get('pageSize')),
		})
		return NextResponse.json(result)
	} catch (error) {
		console.error('[TIK Photobox] Suche fehlgeschlagen:', error)
		return NextResponse.json(
			{ message: 'Photobox-Daten konnten nicht geladen werden.' },
			{ status: 500 },
		)
	}
}

import { NextResponse } from 'next/server'
import { buildLocalCommunityHeader } from '@/lib/regional-unit'
import { listRegionalUnits } from '@/lib/server/regional-units'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
	try {
		const units = await listRegionalUnits()
		const communities = units.flatMap((unit) =>
			unit.communities
				.filter((community) => community.name)
				.map((community) => ({
					documentId: community.documentId,
					name: community.name,
					regionalUnitId: unit.documentId,
					header: buildLocalCommunityHeader(unit, community),
				})),
		)
		communities.sort((left, right) =>
			(left.name ?? '').localeCompare(right.name ?? '', 'de'),
		)
		return NextResponse.json({ communities })
	} catch (error) {
		console.error('Fehler beim Laden der Regionalgruppen:', error)
		return NextResponse.json(
			{ error: 'Regionalgruppen konnten nicht geladen werden.' },
			{ status: 502 },
		)
	}
}

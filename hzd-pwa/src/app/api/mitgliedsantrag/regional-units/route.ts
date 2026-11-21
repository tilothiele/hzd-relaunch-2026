import { NextResponse } from 'next/server'
import { buildRegionalUnitHeader } from '@/lib/regional-unit'
import { listRegionalUnits } from '@/lib/server/regional-units'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
	try {
		const units = await listRegionalUnits()
		return NextResponse.json({
			units: units.map((unit) => ({
				documentId: unit.documentId,
				name: unit.name,
				header: buildRegionalUnitHeader(unit),
			})),
		})
	} catch (error) {
		console.error('Fehler beim Laden der Regionalgruppen:', error)
		return NextResponse.json(
			{ error: 'Regionalgruppen konnten nicht geladen werden.' },
			{ status: 502 },
		)
	}
}

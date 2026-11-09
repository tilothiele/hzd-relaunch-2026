import { NextRequest, NextResponse } from 'next/server'
import {
	getFinanverwaltungContact,
	finanContactAddressLines,
	FinanverwaltungContact,
} from '@/lib/server/finanverwaltung'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface SepaFinanverwaltungResponse {
	region: string | null
	contact: FinanverwaltungContact | null
	adresszeilen: string[]
}

/**
 * GET /api/sepa-mandat/finanverwaltung?region=Nord
 * Liefert die zuständige Finanzverwaltung (HZD Settings) inkl. Adresszeilen
 * für das Webformular /sepa-lastschriftmandat.
 */
export async function GET(request: NextRequest) {
	const region =
		request.nextUrl.searchParams.get('region')?.trim() || null

	if (!region) {
		return NextResponse.json(
			{ error: 'Parameter "region" ist erforderlich.' },
			{ status: 400 },
		)
	}

	try {
		const contact = await getFinanverwaltungContact(region)
		return NextResponse.json({
			region,
			contact,
			adresszeilen: finanContactAddressLines(contact),
		} satisfies SepaFinanverwaltungResponse)
	} catch (error) {
		console.error('Fehler beim Laden der Finanzverwaltung:', error)
		return NextResponse.json(
			{ error: 'Finanzverwaltung konnte nicht geladen werden.' },
			{ status: 502 },
		)
	}
}

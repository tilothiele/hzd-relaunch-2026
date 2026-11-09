import { NextResponse } from 'next/server'
import { getGlaeubigerId } from '@/lib/server/finanverwaltung'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * GET /api/sepa-mandat/glaeubiger-id
 * Liefert die Gläubiger-Identifikationsnummer aus dem Strapi-Backend
 * (HZD Settings > Glaeubiger_Identifikationsnummer) für das Webformular
 * /sepa-lastschriftmandat. Ist keine Nummer hinterlegt, ist `glaeubigerId` null.
 */
export async function GET() {
  try {
    const glaeubigerId = await getGlaeubigerId()
    return NextResponse.json({ glaeubigerId })
  } catch (error) {
    console.error('Fehler beim Laden der Gläubiger-Identifikationsnummer:', error)
    return NextResponse.json(
      { error: 'Gläubiger-Identifikationsnummer konnte nicht geladen werden.' },
      { status: 502 },
    )
  }
}

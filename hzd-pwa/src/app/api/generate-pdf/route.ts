import { NextRequest, NextResponse } from 'next/server';
import { getStrapiJwtFromRequest } from '@/lib/auth-cookie';
import { getMitgliedsantragDokumenteService } from '@/services/mitgliedsantrag-dokumente';
import type { FormData } from '@/types/formData';

export const dynamic = 'force-dynamic';

/**
 * POST /api/generate-pdf
 * Erzeugt den Ortsgruppen-Mitgliedsantrag als PDF.
 *
 * Die DOCX-Vorlage kommt aus Strapi > PWA Settings > Mitgliedsantrag_OG.
 * Es wird nichts gespeichert und keine E-Mail versendet.
 *
 * Body: { formData: FormData }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = body?.formData as FormData | undefined;

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, message: 'FormData ist erforderlich' },
        { status: 400 },
      );
    }

    const userJwt = getStrapiJwtFromRequest(request);
    const pdfBuffer = await getMitgliedsantragDokumenteService().createPdf(
      data,
      userJwt,
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="HZD-Aufnahmeantrag.pdf"',
      },
    });
  } catch (error) {
    const meldung = error instanceof Error ? error.message : String(error);
    console.error('Fehler bei der Mitgliedsantrag-PDF-Generierung:', error);
    const status = /Gotenberg|Strapi|Vorlage|leer|Regionalgruppe|Ortsgruppe/i.test(meldung)
      ? 502
      : 500;
    return NextResponse.json(
      { success: false, message: meldung },
      { status },
    );
  }
}

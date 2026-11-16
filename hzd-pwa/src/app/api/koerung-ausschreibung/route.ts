import { NextRequest, NextResponse } from 'next/server';
import { getStrapiJwtFromRequest } from '@/lib/auth-cookie';
import {
  validateKoerungAusschreibung,
  type KoerungAusschreibungErrors,
} from '@/lib/koerung-ausschreibung-validation';
import {
  DATEINAME,
  getKoerungAusschreibungService,
} from '@/services/koerung-ausschreibung-dokumente';
import type { KoerungAusschreibungFormData } from '@/types/koerung-ausschreibung-form';

export const dynamic = 'force-dynamic';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface DokuMetadaten {
  filename: string;
  mimeType: string;
  base64: string;
}

/**
 * POST /api/koerung-ausschreibung
 * Erzeugt die HZD-Körung-Ausschreibung (DOCX + PDF) und liefert beide
 * Dokumente als Base64 zurück, damit das Webformular Download-Links
 * anzeigen kann.
 *
 * Ablauf serverseitig:
 *   1. Formularwerte validieren (gleiche Regeln wie Frontend)
 *   2. DOCX-Vorlage aus Strapi laden (Single Collection 'PWA Settings')
 *   3. Platzhalter mit docxtemplater befüllen → DOCX
 *   4. DOCX per Gotenberg (/forms/libreoffice/convert) in PDF wandeln
 *
 * Body: { formData: KoerungAusschreibungFormData }
 */
export async function POST(request: NextRequest) {
  let data: KoerungAusschreibungFormData | undefined;
  try {
    const body = (await request.json()) as {
      formData?: KoerungAusschreibungFormData;
    };
    data = body?.formData;
  } catch {
    data = undefined;
  }

  if (!data || typeof data !== 'object') {
    return NextResponse.json(
      { success: false, message: 'FormData ist erforderlich' },
      { status: 400 },
    );
  }

  const validation = validateKoerungAusschreibung(data);
  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        message: 'Validierungsfehler',
        errors: validation.errors,
      } satisfies {
        success: false;
        message: string;
        errors: KoerungAusschreibungErrors;
      },
      { status: 400 },
    );
  }

  try {
    const userJwt = getStrapiJwtFromRequest(request);
    const service = getKoerungAusschreibungService();
    const { docx, pdf } = await service.createDokumente(data, userJwt);

    console.log('HZD-Körung-Ausschreibung erstellt', {
      meldeschluss: data.meldeschluss,
      timestamp: new Date().toISOString(),
    });

    const dokumente: { docx: DokuMetadaten; pdf: DokuMetadaten } = {
      docx: {
        filename: `${DATEINAME}.docx`,
        mimeType: DOCX_MIME,
        base64: Buffer.from(new Uint8Array(docx)).toString('base64'),
      },
      pdf: {
        filename: `${DATEINAME}.pdf`,
        mimeType: 'application/pdf',
        base64: Buffer.from(new Uint8Array(pdf)).toString('base64'),
      },
    };

    return NextResponse.json({ success: true, dokumente });
  } catch (error) {
    const meldung =
      error instanceof Error ? error.message : String(error);
    console.error('Fehler bei der HZD-Körung-Ausschreibung generierung:', error);

    const status =
      // Gotenberg nicht erreichbar / Vorlage-Problem etc.
      /Gotenberg|Strapi|Vorlage|leer/i.test(meldung) ? 502 : 500;

    return NextResponse.json(
      { success: false, message: meldung },
      { status },
    );
  }
}

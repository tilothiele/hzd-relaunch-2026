import { NextRequest, NextResponse } from 'next/server';
import { validateSepaMandatFormData } from '@/lib/sepa-mandat-validation';
import type { SepaMandatFormData } from '@/types/sepa-mandat-form';
import { getSepaMandatPdfService } from '@/services/sepa-mandat-pdf';

/**
 * POST /api/sepa-mandat-pdf
 * Erzeugt das SEPA-Lastschriftmandat (HZD Formular 032) als PDF.
 * Body: { formData: SepaMandatFormData }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = body?.formData as SepaMandatFormData | undefined;

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, message: 'FormData ist erforderlich' },
        { status: 400 }
      );
    }

    const validation = validateSepaMandatFormData(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: 'Validierungsfehler', errors: validation.errors },
        { status: 400 }
      );
    }

    const pdfService = getSepaMandatPdfService();
    const pdfBuffer = await pdfService.createPdf(data);

    console.log('SEPA-Lastschriftmandat PDF erstellt', {
      regionalgruppe: data.regionalgruppe,
      timestamp: new Date().toISOString(),
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="SEPA-Lastschriftmandat.pdf"',
      },
    });
  } catch (error) {
    console.error('Fehler bei der SEPA-Lastschriftmandat-PDF-Generierung:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler bei der PDF-Generierung' },
      { status: 500 }
    );
  }
}

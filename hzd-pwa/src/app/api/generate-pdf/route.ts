import { NextRequest, NextResponse } from 'next/server';
import { getPdfService } from '../../../services/pdfService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData } = body;

    console.log(formData);

    // PDF über Service erstellen
    const pdfService = getPdfService();
    const pdfBuffer = await pdfService.createPdf(formData);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="HZD-Aufnahmeantrag.pdf"'
      }
    });

  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
    return NextResponse.json(
      { error: 'Fehler bei der PDF-Generierung' },
      { status: 500 }
    );
  }
}
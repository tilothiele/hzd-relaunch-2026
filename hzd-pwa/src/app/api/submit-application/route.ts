import { NextRequest, NextResponse } from 'next/server';
import { withAltcha } from '@/lib/server/altcha';
import { getApplicationService } from '../../../services/applicationService';
import { ApplicationSubmissionRequest } from '../../../types/api';

export async function POST(req: NextRequest) {
  return withAltcha(req, () => submitApplication(req));
}

async function submitApplication(req: NextRequest) {
  try {
    const { formData, uuid } = await req.json();

    if (!formData) {
      return NextResponse.json(
        { success: false, message: 'FormData ist erforderlich' },
        { status: 400 }
      );
    }

    if (!uuid) {
      return NextResponse.json(
        { success: false, message: 'UUID ist erforderlich' },
        { status: 400 }
      );
    }

    // ApplicationService verwenden
    const applicationService = getApplicationService();

    // FormData validieren
    const validation = applicationService.validateFormData(formData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validierungsfehler',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    // Antragsanmeldung speichern
    const request: ApplicationSubmissionRequest = {
      formData,
      uuid
    };
    const result = await applicationService.submitApplication(request);

    if (!result.success) {
      const statusCode = result.message.includes('bereits') ? 409 : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    console.log('Antragsanmeldung erfolgreich gespeichert:', {
      uuid: result.uuid,
      email: result.email,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Fehler bei der Antragsanmeldung:', error);
    return NextResponse.json(
      { success: false, message: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}



import { DatabaseService } from '../../lib/database-prisma';
import { serverLog } from '../../lib/server-only';
import { getWorkflowService } from '../../services/workflowService';
import { FormData as FormDataType } from '../../types/formData';
import Image from 'next/image';

interface VerifyEmailPageProps {
  searchParams: Promise<{ uuid?: string; email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const uuid = params.uuid;
  const email = params.email;

  // Fehler: Fehlende Parameter
  if (!uuid || !email) {
    return <ErrorPage message="UUID und E-Mail-Adresse sind erforderlich" />;
  }

  try {
    const db = new DatabaseService();
    await db.initializeDatabase();

    // Suche die Application anhand von Email
    const application = await db.getApplicationByEmail(email);

    if (!application) {
      return <ErrorPage message="Keine Anmeldung für diese E-Mail-Adresse gefunden" />;
    }

    // Prüfe ob die UUID übereinstimmt
    if (application.uuid !== uuid) {
      return <ErrorPage message="Ungültiger Verifizierungslink" />;
    }

    // Prüfe ob eine Verifizierungs-E-Mail gesendet wurde
    if (!application.verificationSentAt) {
      return <ErrorPage message="Keine Verifizierungsanfrage für diese Anmeldung" />;
    }

    // Prüfe ob die Verifizierung abgelaufen ist (älter als 30 Minuten)
    const now = new Date();
    const sentAt = new Date(application.verificationSentAt);
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    if (sentAt < thirtyMinutesAgo) {
      return <ErrorPage message="Der Verifizierungslink ist abgelaufen (älter als 30 Minuten)" />;
    }

    serverLog(`E-Mail-Verifizierung erfolgreich für: ${email}`);

    // Parse die FormData aus dem payload
    let formData: FormDataType | null = null;
    if (application.payload) {
      try {
        formData = JSON.parse(application.payload);
      } catch (error) {
        console.error('Fehler beim Parsen der FormData:', error);
      }
    }

    if(!formData) {
      return <ErrorPage message="Fehler beim Parsen der FormData" />;
    }

    // rufe workflowService.neuesMitglied auf
    const workflowService = getWorkflowService();
    await workflowService.neuesMitglied(formData);


    // Erfolgreiche Verifizierung
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-900 text-white px-8 py-5 flex items-center justify-center relative">
            <h1 className="text-3xl font-bold">HZD OG Hamburg u.U.</h1>
            <Image 
              src="/logo.png" 
              alt="HZD Logo" 
              width={80} 
              height={80}
              className="bg-white rounded m-1 p-1 absolute right-8"
            />
          </div>

          {/* Success Message */}
          <div className="bg-green-600 text-white px-8 py-4">
            <h2 className="text-xl font-semibold flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              E-Mail-Adresse erfolgreich verifiziert
            </h2>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <p className="text-gray-700 mb-6">
              Ihre E-Mail-Adresse wurde erfolgreich bestätigt.
            </p>

            {/* Gespeicherte Anmeldung */}
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Ihre gespeicherte Anmeldung:
            </h3>
            <div className="bg-gray-50 border-l-4 border-blue-900 px-6 py-4 mb-6">
              <div className="mb-2">
                <span className="font-semibold text-gray-700">E-Mail:</span>
                <span className="ml-2 text-gray-600">{email}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Registriert am:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(application.creationDate).toLocaleString('de-DE')}
                </span>
              </div>
            </div>

            {/* Anmeldungsdaten */}
            {formData && (
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Ihre Anmeldungsdaten:
                </h3>
                <div className="bg-gray-50 border-l-4 border-blue-900 px-6 py-4 mb-6 space-y-2">
                  <div>
                    <span className="font-semibold text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">
                      {formData.vorname || ''} {formData.name || ''}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Adresse:</span>
                    <span className="ml-2 text-gray-600">
                      {formData.strasse || ''}, {formData.plz || ''} {formData.ort || ''}
                    </span>
                  </div>
                  {formData.telefon && (
                    <div>
                      <span className="font-semibold text-gray-700">Telefon:</span>
                      <span className="ml-2 text-gray-600">{formData.telefon}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Mitgliedschaft:</span>
                    <span className="ml-2 text-gray-600">{formData.mitgliedschaft || ''}</span>
                  </div>
                </div>
              </>
            )}

            <p className="text-gray-700 mb-6">
              Ihre Anmeldung wurde bereits in unserem System gespeichert.
              Falls Sie Änderungen vornehmen möchten, wenden Sie sich bitte an:
            </p>

            {/* Footer/Kontakt */}
            <div className="border-t border-gray-200 pt-6 mt-6 text-sm text-gray-600">
              <p className="font-semibold text-gray-700 mb-2">Kontakt:</p>
              <p>
                HZD OG Hamburg u.U.<br />
                Tilo Thiele<br />
                Anne-Becker-Ring 8<br />
                21031 Hamburg<br />
                <a
                  href="mailto:geschaeftsstelle@hzd-og-hamburg.de"
                  className="text-blue-600 hover:underline"
                >
                  geschaeftsstelle@hzd-og-hamburg.de
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Fehler bei der E-Mail-Verifizierung:', error);
    return <ErrorPage message="Interner Serverfehler bei der Verifizierung" />;
  }
}

// Error Page Component
function ErrorPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 text-white px-8 py-5 flex items-center justify-center relative">
          <h1 className="text-3xl font-bold">HZD OG Hamburg u.U.</h1>
          <Image 
            src="/logo.png" 
            alt="HZD Logo" 
            width={80} 
            height={80}
            className="bg-white rounded m-1 p-1 absolute right-8"
          />
        </div>

        {/* Error Message */}
        <div className="bg-red-600 text-white px-8 py-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Verifizierung fehlgeschlagen
          </h2>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <p className="text-gray-700 mb-6">{message}</p>

          <p className="text-gray-600 text-sm">
            Falls Sie Hilfe benötigen, wenden Sie sich bitte an:
          </p>

          <div className="border-t border-gray-200 pt-6 mt-6 text-sm text-gray-600">
            <p className="font-semibold text-gray-700 mb-2">Kontakt:</p>
            <p>
              HZD OG Hamburg u.U.<br />
              Tilo Thiele<br />
              Anne-Becker-Ring 8<br />
              21031 Hamburg<br />
              <a
                href="mailto:geschaeftsstelle@hzd-og-hamburg.de"
                className="text-blue-600 hover:underline"
              >
                geschaeftsstelle@hzd-og-hamburg.de
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



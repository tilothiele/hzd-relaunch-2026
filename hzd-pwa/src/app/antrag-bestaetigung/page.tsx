import Link from 'next/link';
import Image from 'next/image';

interface ConfirmationPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function AntragBestaetigungPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const email = params.email;

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
            Antrag erfolgreich eingegangen
          </h2>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="mb-6">
            <p className="text-lg text-gray-800 mb-4">
              Vielen Dank für Ihre Anmeldung!
            </p>
            <p className="text-gray-700 mb-4">
              Ihr Antrag ist bei uns eingegangen und wird bearbeitet.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-900 px-6 py-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Wie geht es weiter?
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>
                Der Papierausdruck Ihres Antrags muss noch unterschrieben werden
              </li>
              <li>
                Nach Eingang der unterschriebenen Unterlagen erfolgt eine endgültige Bestätigung
              </li>
              <li>
                Sie erhalten dann alle weiteren Informationen zur Mitgliedschaft
              </li>
            </ol>
          </div>

          {/* Email Info */}
          {email && (
            <div className="bg-gray-50 border border-gray-200 rounded px-6 py-4 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Wichtig:</span> Eine vorläufige Bestätigung wurde an{' '}
                <span className="font-semibold text-gray-800">{email}</span> gesendet.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Bitte überprüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten haben.
              </p>
            </div>
          )}

          {/* Additional Info */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Benötigen Sie weitere Informationen?
            </h3>
            <p className="text-gray-700 mb-4">
              Bei Fragen oder Unklarheiten können Sie sich jederzeit an uns wenden:
            </p>

            <div className="bg-gray-50 rounded px-6 py-4">
              <p className="text-sm text-gray-700">
                <strong>Kontakt:</strong><br />
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

          {/* Back to Home Button */}
          <div className="mt-8 text-center">
            <Link 
              href="/mitgliedsantrag"
              className="inline-block bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors font-semibold"
            >
              Zurück zum Mitgliedsantrag
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



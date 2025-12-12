import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-Funktion zum Absenden von Formularen
 * Empfängt die documentId und die Formular-Antworten als JSON
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { documentId, formData } = body

		if (!documentId) {
			return NextResponse.json(
				{ error: 'documentId is required' },
				{ status: 400 },
			)
		}

		if (!formData) {
			return NextResponse.json(
				{ error: 'formData is required' },
				{ status: 400 },
			)
		}

		// TODO: Hier die Logik zum Speichern der Formular-Daten implementieren
		// z.B. in Strapi speichern oder an einen externen Service senden
		console.log('Formular abgesendet:', {
			documentId,
			formData: JSON.stringify(formData, null, 2),
		})

		return NextResponse.json({
			success: true,
			message: 'Formular erfolgreich abgesendet',
		})
	} catch (error) {
		console.error('Fehler beim Absenden des Formulars:', error)

		if (error instanceof Error) {
			return NextResponse.json(
				{ error: { message: error.message } },
				{ status: 500 },
			)
		}

		return NextResponse.json(
			{ error: { message: 'Formular konnte nicht abgesendet werden' } },
			{ status: 500 },
		)
	}
}


import { NextRequest, NextResponse } from 'next/server'
import { getStrapiBaseUrl } from '@/lib/server/strapi-client'
import { createFormInstance } from '@/lib/strapi/api'

/**
 * Server-Funktion zum Absenden von Formularen
 * Empfängt die documentId und die Formular-Antworten als JSON
 * Speichert die Daten als form-instance im Backend
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

		const baseUrl = getStrapiBaseUrl()

		const mutationData = {
			form: documentId,
			Content: formData,
		}

		try {
			const result = await createFormInstance(mutationData, {
				server: true,
				baseUrl,
			})

			console.log('Formular erfolgreich gespeichert:', {
				documentId: result.documentId,
				formDocumentId: documentId,
			})

			return NextResponse.json({
				success: true,
				message: 'Formular erfolgreich abgesendet',
				data: {
					documentId: result.documentId,
				},
			})
		} catch (strapiError) {
			console.error('Strapi Fehler beim Speichern der form-instance:', strapiError)

			let errorMessage = 'Formular konnte nicht abgesendet werden'
			if (strapiError instanceof Error) {
				errorMessage = strapiError.message
			}

			return NextResponse.json(
				{ error: { message: errorMessage } },
				{ status: 500 },
			)
		}
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

import { NextRequest, NextResponse } from 'next/server'
import { fetchGraphQLServer, getStrapiBaseUrl } from '@/lib/server/graphql-client'
import { CREATE_FORM_INSTANCE } from '@/lib/graphql/queries'
import type { CreateFormInstanceResult } from '@/types'
import type { FormInstance } from '@/types'

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

		// Speichere die form-instance im Backend
		const baseUrl = getStrapiBaseUrl()

		// In Strapi werden Relations normalerweise als documentId übergeben
		// formData wird als JSON-Objekt gespeichert (Strapi JSON-Feld)
		const mutationData = {
			form: documentId,
			Content: formData,
		}

		try {
			const result = await fetchGraphQLServer<FormInstance>(
				CREATE_FORM_INSTANCE,
				{
					baseUrl,
					variables: {
						data: mutationData,
					},
				},
			)

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
		} catch (graphqlError) {
			console.error('GraphQL Fehler beim Speichern der form-instance:', graphqlError)

			// Detaillierte Fehlerinformationen aus GraphQL-Error extrahieren
			let errorMessage = 'Formular konnte nicht abgesendet werden'
			if (graphqlError instanceof Error) {
				errorMessage = graphqlError.message
			}

			// Prüfe ob es ein GraphQL Response Error ist
			if (graphqlError && typeof graphqlError === 'object' && 'response' in graphqlError) {
				const responseError = graphqlError as { response?: { errors?: Array<{ message?: string }> } }
				if (responseError.response?.errors?.[0]?.message) {
					errorMessage = responseError.response.errors[0].message
				}
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


import { NextRequest, NextResponse } from 'next/server'
import { fetchGraphQLServer, getStrapiBaseUrl } from '@/lib/server/graphql-client'
import { GET_FORM_INSTANCES_BY_EVENT_ADMIN } from '@/lib/graphql/queries'
import type { FormInstance, FormField } from '@/types'

interface FormInstancesQueryResult {
	formInstances: FormInstance[]
}

/**
 * Dekodiert Base64URL String
 */
function decodeBase64URL(base64url: string): string {
	try {
		// Ersetze URL-sichere Zeichen
		let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')

		// Füge Padding hinzu, falls nötig
		while (base64.length % 4) {
			base64 += '='
		}

		return Buffer.from(base64, 'base64').toString('utf-8')
	} catch {
		return ''
	}
}

/**
 * Dekodiert einen JWT-Token und gibt den Payload zurück
 */
function decodeJWT(token: string): { id?: number; documentId?: string } | null {
	try {
		const parts = token.split('.')
		if (parts.length !== 3) {
			return null
		}

		const payloadDecoded = decodeBase64URL(parts[1])
		const payload = JSON.parse(payloadDecoded) as { id?: number; documentId?: string }

		return payload
	} catch {
		return null
	}
}

/**
 * Extrahiert Feldnamen aus FormFields
 */
function extractFieldNamesFromForm(formFields: FormField[] | null | undefined): string[] {
	if (!formFields) {
		return []
	}

	const fieldNames: string[] = []

	for (const field of formFields) {
		let fieldName: string | null | undefined = null

		switch (field.__typename) {
			case 'ComponentFormShortTextInput':
				fieldName = field.STName
				break
			case 'ComponentFormEmailAdress':
				fieldName = field.EAName
				break
			case 'ComponentFormTextArea':
				fieldName = field.TAName
				break
			case 'ComponentFormNumberInput':
				fieldName = field.NIName
				break
			case 'ComponentFormChoice':
				fieldName = field.CName
				break
			case 'ComponentFormBooleanChoice':
				fieldName = field.BCName
				break
			// GroupSeparator, StaticText, FormSubmitButton werden nicht als Felder verwendet
		}

		if (fieldName) {
			fieldNames.push(fieldName)
		}
	}

	return fieldNames
}

/**
 * Konvertiert form instances zu CSV
 */
function convertToCSV(formInstances: FormInstance[]): string {
	if (formInstances.length === 0) {
		return 'Keine Daten verfügbar'
	}

	// Sammle alle Feldnamen aus allen Formularen
	const allFieldNames = new Set<string>()
	for (const instance of formInstances) {
		if (instance.form?.FormFields) {
			const fieldNames = extractFieldNamesFromForm(instance.form.FormFields)
			fieldNames.forEach((name) => allFieldNames.add(name))
		}
	}

	const fieldNames = Array.from(allFieldNames).sort()
	const headers = ['Formular', 'Datum', 'Erstellt', ...fieldNames]
	const rows: string[] = [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',')]

	// CSV Zeilen
	for (const instance of formInstances) {
		const formName = instance.form?.Name ?? 'Unbekannt'
		const date = instance.createdAt
			? new Date(instance.createdAt).toLocaleDateString('de-DE')
			: 'Unbekannt'
		const dateTime = instance.createdAt
			? new Date(instance.createdAt).toLocaleString('de-DE')
			: 'Unbekannt'

		const row: string[] = [
			`"${formName.replace(/"/g, '""')}"`,
			`"${date.replace(/"/g, '""')}"`,
			`"${dateTime.replace(/"/g, '""')}"`,
		]

		const fields = instance.Content
			? ((instance.Content.fields as Record<string, unknown>) || instance.Content)
			: {}

		// Verwende nur die Feldnamen, die im Form definiert sind
		const formFieldNames = instance.form?.FormFields
			? extractFieldNamesFromForm(instance.form.FormFields)
			: []

		for (const fieldName of fieldNames) {
			// Wenn das Feld in diesem Formular definiert ist, verwende den Wert
			// Ansonsten bleibt die Zelle leer
			let cellValue = ''

			if (formFieldNames.includes(fieldName)) {
				const value = fields[fieldName]
				if (value !== null && value !== undefined) {
					if (typeof value === 'object') {
						cellValue = JSON.stringify(value)
					} else {
						cellValue = String(value)
					}
				}
			}

			row.push(`"${cellValue.replace(/"/g, '""')}"`)
		}

		rows.push(row.join(','))
	}

	return rows.join('\n')
}

/**
 * Server-Funktion zum Abrufen von form instances als CSV
 * Filtert nach EventAdmin des aktuell angemeldeten Benutzers
 */
export async function GET(request: NextRequest) {
	try {
		// Extrahiere JWT Token aus Authorization Header
		const authHeader = request.headers.get('authorization')
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return NextResponse.json(
				{ error: 'Authorization header mit Bearer token erforderlich' },
				{ status: 401 },
			)
		}

		const token = authHeader.substring(7) // Entferne "Bearer "

		// Dekodiere Token um User ID zu erhalten
		const payload = decodeJWT(token)
		if (!payload || !payload.id) {
			return NextResponse.json(
				{ error: 'Ungültiger Token' },
				{ status: 401 },
			)
		}

		const userId = payload.id
		const baseUrl = getStrapiBaseUrl()

		// Lade alle form instances
		const result = await fetchGraphQLServer<FormInstancesQueryResult>(
			GET_FORM_INSTANCES_BY_EVENT_ADMIN,
			{
				baseUrl,
				token,
			},
		)

		// Filtere nach EventAdmin
		// EventAdmin.documentId sollte mit der User ID übereinstimmen
		const filteredInstances = result.formInstances.filter((instance) => {
			const eventAdminDocumentId = instance.form?.EventAdmin?.documentId
			if (!eventAdminDocumentId) {
				return false
			}

			// Vergleiche documentId mit User ID (beide als String)
			return eventAdminDocumentId === String(userId)
		})

		// Konvertiere zu CSV
		const csv = convertToCSV(filteredInstances)

		// Setze CSV Headers
		return new NextResponse(csv, {
			status: 200,
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="form-instances-${new Date().toISOString().split('T')[0]}.csv"`,
			},
		})
	} catch (error) {
		console.error('Fehler beim Abrufen der form instances:', error)

		if (error instanceof Error) {
			return NextResponse.json(
				{ error: { message: error.message } },
				{ status: 500 },
			)
		}

		return NextResponse.json(
			{ error: { message: 'Form instances konnten nicht abgerufen werden' } },
			{ status: 500 },
		)
	}
}


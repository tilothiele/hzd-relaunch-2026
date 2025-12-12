/**
 * Extrahiert die E-Mail-Adresse aus den Formular-Daten
 */
export function extractEmailFromFormData(formData: Record<string, unknown>): string | null {
	// Prüfe ob formData.fields existiert (Struktur: { formId, formName, fields })
	const fields = (formData.fields as Record<string, unknown>) || formData

	// Durchsuche alle Felder nach einer E-Mail-Adresse
	for (const [key, value] of Object.entries(fields)) {
		if (typeof value === 'string') {
			// Prüfe ob der Wert eine E-Mail-Adresse ist
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (emailRegex.test(value)) {
				return value
			}
			// Prüfe ob der Feldname auf E-Mail hindeutet
			if (key.toLowerCase().includes('email') || key.toLowerCase().includes('e-mail') || key.toLowerCase().includes('mail')) {
				if (emailRegex.test(value)) {
					return value
				}
			}
		}
	}

	return null
}

/**
 * Sendet eine generische E-Mail über die Strapi Backend Route
 */
export async function sendEmail(
	baseUrl: string,
	to: string,
	formData: Record<string, unknown>,
): Promise<void> {
	const effectiveBaseUrl = baseUrl.replace(/\/$/, '')
	const emailEndpoint = `${effectiveBaseUrl}/api/email`

	// Erstelle eine generische E-Mail
	const emailSubject = 'Formular erfolgreich abgesendet'

	// Erstelle E-Mail-Body aus den Formular-Daten
	const fields = (formData.fields as Record<string, unknown>) || formData
	const emailBody = Object.entries(fields)
		.map(([key, value]) => {
			// Überspringe E-Mail-Feld im Body
			if (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
				return null
			}
			return `${key}: ${value}`
		})
		.filter(Boolean)
		.join('\n')

	const emailContent = `Ihr Formular wurde erfolgreich abgesendet.\n\nFormular-Daten:\n${emailBody}`

	const response = await fetch(emailEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			to,
			subject: emailSubject,
			text: emailContent,
			html: emailContent.replace(/\n/g, '<br>'),
		}),
	})

	if (!response.ok) {
		const errorData = await response.json().catch(() => null)
		throw new Error(errorData?.error?.message || `E-Mail konnte nicht gesendet werden (Status: ${response.status})`)
	}
}


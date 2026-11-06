import type { Core } from '@strapi/strapi'

const HZD_SETTING_UID = 'api::hzd-setting.hzd-setting' as const

export function readText(value: unknown): string {
	return typeof value === 'string' ? value : ''
}

export function isSet(value: unknown): boolean {
	return readText(value).trim() !== ''
}

export function displayValue(value: unknown): string {
	return isSet(value) ? readText(value) : '–'
}

function readEmail(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null
	}
	const email = value.trim()
	return email.includes('@') ? email : null
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

/**
 * HTML (z. B. BreedersIntroduction) für die Text-Version der Mail in
 * lesbaren Klartext umwandeln: Tags entfernen, Zeilenumbrüche beibehalten.
 */
export function htmlToText(html: string): string {
	const text = html
		.replace(/<br\s*\/?\s*>/gi, '\n')
		.replace(/<\/(p|div|li|ul|ol|h[1-6]|tr|table|blockquote|pre)>/gi, '\n')
		.replace(/<[^>]*>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#0?39;/g, "'")
		.replace(/&amp;/gi, '&')
	return text
		.split('\n')
		.map((line) => line.replace(/\s+/g, ' ').trim())
		.filter((line) => line !== '')
		.join('\n')
}

export async function readReportEmail(strapi: Core.Strapi): Promise<string | null> {
	const published = await strapi.documents(HZD_SETTING_UID).findFirst({
		status: 'published',
		fields: ['ReportEmail'],
	})
	const publishedEmail = readEmail(published?.ReportEmail)
	if (publishedEmail) {
		return publishedEmail
	}

	const draft = await strapi.documents(HZD_SETTING_UID).findFirst({
		status: 'draft',
		fields: ['ReportEmail'],
	})
	return readEmail(draft?.ReportEmail)
}

export interface MailRow {
	label: string
	value: string
	isHtml?: boolean
}

export function mailRow(label: string, value: unknown, isHtml = false): MailRow {
	if (isSet(value)) {
		return { label, value: readText(value).trim(), isHtml }
	}
	return { label, value: '–' }
}

/**
 * Benutzer-Label: "Vorname Nachname (Mitgliedsnummer: X)",
 * Fallbacks auf username bzw. "Unbekannter Benutzer".
 */
export function benutzerMailValue(user: Record<string, unknown>): string {
	const firstName = readText(user.firstName).trim()
	const lastName = readText(user.lastName).trim()
	const name = `${firstName} ${lastName}`.trim()
	const username = readText(user.username).trim()
	const label = name !== '' ? name : (username !== '' ? username : 'Unbekannter Benutzer')
	const membership = user.membershipNumber != null
		? ` (Mitgliedsnummer: ${String(user.membershipNumber)})`
		: ' (Mitgliedsnummer: –)'
	return `${label}${membership}`
}

export function buildMailText(rows: MailRow[], intro?: string): string {
	const lines: string[] = []
	if (intro) {
		lines.push(intro, '')
	}
	for (const row of rows) {
		lines.push(`${row.label}: ${row.isHtml ? htmlToText(row.value) : row.value}`)
	}
	return lines.join('\n')
}

export function buildMailHtml(
	rows: MailRow[],
	heading: string,
	intro?: string,
): string {
	const bodyRows = rows
		.map((row) => (
			`<tr><th>${escapeHtml(row.label)}</th><td>${row.isHtml
				? row.value
				: escapeHtml(row.value)}</td></tr>`
		))
		.join('')
	const introHtml = intro ? `<p>${escapeHtml(intro)}</p>` : ''

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body { font-family: Arial, sans-serif; line-height: 1.45; color: #333; }
.container { max-width: 860px; margin: 0 auto; padding: 20px; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 20px; font-size: 14px; }
th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f6f6f6; width: 34%; }
h2 { margin-bottom: 8px; }
p { margin-bottom: 12px; }
</style>
</head>
<body>
<div class="container">
<h2>${escapeHtml(heading)}</h2>
${introHtml}
<table><tbody>${bodyRows}</tbody></table>
</div>
</body>
</html>`
}

import type { Core } from '@strapi/strapi'

const HZD_SETTING_UID = 'api::hzd-setting.hzd-setting' as const

export interface BreederChangeValues {
	isDirty: boolean
	WebsiteUrlDraft: string | null
	BreedersIntroDraft: string | null
	BreedersMessage: string | null
}

export interface BreederChangeMailModel {
	user: Record<string, unknown>
	kennelName: string | null
	websiteUrlDraft: string | null
	websiteUrl: string | null
	breedersIntroDraft: string | null
	breedersIntro: string | null
	breedersMessage: string | null
}

function readText(value: unknown): string {
	return typeof value === 'string' ? value : ''
}

function isSet(value: unknown): boolean {
	return readText(value).trim() !== ''
}

function readEmail(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null
	}
	const email = value.trim()
	return email.includes('@') ? email : null
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

function displayValue(value: unknown): string {
	return isSet(value) ? readText(value) : '–'
}

/**
 * HTML (z. B. BreedersIntroduction) für die Text-Version der Mail in
 * lesbaren Klartext umwandeln: Tags entfernen, Zeilenumbrüche beibehalten.
 */
function htmlToText(html: string): string {
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

async function readReportEmail(strapi: Core.Strapi): Promise<string | null> {
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

function userLabel(user: Record<string, unknown>): string {
	const firstName = readText(user.firstName).trim()
	const lastName = readText(user.lastName).trim()
	const name = `${firstName} ${lastName}`.trim()
	if (name) {
		return name
	}
	const username = readText(user.username).trim()
	return username !== '' ? username : 'Unbekannter Benutzer'
}

/**
 * Mail soll gesendet werden, wenn IsDirty von false auf true wechselt,
 * oder wenn IsDirty auf true bleibt und mindestens einer der Inhaltswerte
 * (WebsiteUrlDraft / BreedersIntroDraft / BreedersMessage) sich ändert.
 */
export function shouldSendBreederChangeMail(
	previous: BreederChangeValues,
	current: BreederChangeValues,
): boolean {
	const newlyDirty = !previous.isDirty && current.isDirty
	const staysDirty = previous.isDirty && current.isDirty
	const fieldsChanged =
		readText(previous.WebsiteUrlDraft) !== readText(current.WebsiteUrlDraft)
		|| readText(previous.BreedersIntroDraft) !== readText(current.BreedersIntroDraft)
		|| readText(previous.BreedersMessage) !== readText(current.BreedersMessage)
	return newlyDirty || (staysDirty && fieldsChanged)
}

interface MailRow {
	label: string
	value: string
	isHtml?: boolean
}

function mailRow(label: string, value: unknown, isHtml = false): MailRow {
	if (isSet(value)) {
		return { label, value: readText(value).trim(), isHtml }
	}
	return { label, value: '–' }
}

function mailRows(model: BreederChangeMailModel): MailRow[] {
	const membership = model.user.membershipNumber != null
		? ` (Mitgliedsnummer: ${String(model.user.membershipNumber)})`
		: ' (Mitgliedsnummer: –)'

	const rows: MailRow[] = [
		{ label: 'Benutzer', value: `${userLabel(model.user)}${membership}` },
		{ label: 'Zwingername', value: displayValue(model.kennelName) },
	]

	if (isSet(model.websiteUrlDraft)) {
		rows.push(mailRow('WebsiteUrlDraft', model.websiteUrlDraft))
		rows.push(mailRow('WebsiteUrl (aktuell)', model.websiteUrl))
	}

	if (isSet(model.breedersIntroDraft)) {
		rows.push(mailRow('BreedersIntroDraft', model.breedersIntroDraft))
		rows.push(
			mailRow('BreedersIntroduction (aktuell)', model.breedersIntro, true),
		)
	}

	rows.push(mailRow('BreedersMessage', model.breedersMessage))

	return rows
}

function buildText(rows: MailRow[]): string {
	const lines = [
		'Ein eingeloggter Benutzer hat Zwingerdaten gespeichert (IsDirty = true).',
		'',
	]
	for (const row of rows) {
		lines.push(`${row.label}: ${row.isHtml ? htmlToText(row.value) : row.value}`)
	}
	return lines.join('\n')
}

function buildHtml(rows: MailRow[]): string {
	const bodyRows = rows
		.map((row) => (
			`<tr><th>${escapeHtml(row.label)}</th><td>${row.isHtml
				? row.value
				: escapeHtml(row.value)}</td></tr>`
		))
		.join('')

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
</style>
</head>
<body>
<div class="container">
<h2>Zwingerdaten gespeichert</h2>
<table><tbody>${bodyRows}</tbody></table>
</div>
</body>
</html>`
}

export async function sendBreederChangeMail(
	strapi: Core.Strapi,
	model: BreederChangeMailModel,
): Promise<boolean> {
	const kennelName = isSet(model.kennelName)
		? readText(model.kennelName).trim()
		: '(ohne Zwingername)'

	const recipient = await readReportEmail(strapi)
	if (!recipient) {
		strapi.log.info(
			`Zwingerdaten (${kennelName}): keine ReportEmail in den HZD-Settings hinterlegt, Benachrichtigung wird nicht gesendet.`,
		)
		return false
	}

	const subject = `Züchterdaten ändern ${kennelName}`
	const rows = mailRows(model)

	await strapi.plugin('email').service('email').send({
		to: recipient,
		subject,
		text: buildText(rows),
		html: buildHtml(rows),
	})

	strapi.log.info(
		`Zwingerdaten (${kennelName}): Benachrichtigung an ${recipient} gesendet.`,
	)
	return true
}

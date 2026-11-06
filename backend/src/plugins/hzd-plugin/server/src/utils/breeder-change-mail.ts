import type { Core } from '@strapi/strapi'
import {
	MailRow,
	benutzerMailValue,
	buildMailHtml,
	buildMailText,
	isSet,
	mailRow,
	readReportEmail,
	readText,
} from './mail-common'

export interface BreederChangeValues {
	isDirty: boolean
	WebsiteUrlDraft: string | null
	BreedersIntroDraft: string | null
	BreedersMessage: string | null
}

export interface BreederChangeMailModel {
	user: Record<string, unknown>
	/** BreederRole = "S": Deckrüdenbesitzer (betreff/überschrift anpassen). */
	isDeckrueden?: boolean
	kennelName: string | null
	websiteUrlDraft: string | null
	websiteUrl: string | null
	breedersIntroDraft: string | null
	breedersIntro: string | null
	breedersMessage: string | null
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

function mailRows(model: BreederChangeMailModel): MailRow[] {
	const rows: MailRow[] = [
		{ label: 'Benutzer', value: benutzerMailValue(model.user) },
		mailRow('Zwingername', model.kennelName),
	]

	if (isSet(model.websiteUrlDraft)) {
		rows.push(mailRow('WebsiteUrlDraft', model.websiteUrlDraft))
		rows.push(mailRow('WebsiteUrl (aktuell)', model.websiteUrl))
	}

	if (isSet(model.breedersIntroDraft)) {
		rows.push(mailRow('BreedersIntroDraft', model.breedersIntroDraft))
		rows.push(mailRow('BreedersIntroduction (aktuell)', model.breedersIntro, true))
	}

	rows.push(mailRow('BreedersMessage', model.breedersMessage))

	return rows
}

export async function sendBreederChangeMail(
	strapi: Core.Strapi,
	model: BreederChangeMailModel,
): Promise<boolean> {
	const isDeckrueden = model.isDeckrueden === true
	const dataLabel = isDeckrueden ? 'Deckrüdenbesitzerdaten' : 'Zwingerdaten'
	const kennelName = isSet(model.kennelName)
		? readText(model.kennelName).trim()
		: '(ohne Zwingername)'

	const recipient = await readReportEmail(strapi)
	if (!recipient) {
		strapi.log.info(
			`${dataLabel} (${kennelName}): keine ReportEmail in den HZD-Settings hinterlegt, Benachrichtigung wird nicht gesendet.`,
		)
		return false
	}

	const subject = `${isDeckrueden ? 'Deckrüdenbesitzerdaten' : 'Züchterdaten'} ändern ${kennelName}`
	const intro = `Ein eingeloggter Benutzer hat ${dataLabel} gespeichert (IsDirty = true).`
	const heading = `${dataLabel} gespeichert`
	const rows = mailRows(model)

	await strapi.plugin('email').service('email').send({
		to: recipient,
		subject,
		text: buildMailText(rows, intro),
		html: buildMailHtml(rows, heading, intro),
	})

	strapi.log.info(
		`${dataLabel} (${kennelName}): Benachrichtigung an ${recipient} gesendet.`,
	)
	return true
}

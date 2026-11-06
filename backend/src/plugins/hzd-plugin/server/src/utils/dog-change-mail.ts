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

export interface DogChangeMailModel {
	user: Record<string, unknown>
	dogName: string | null
	kennelName: string | null
	/** Persönliche Worte (veröffentlicht) – HTML */
	memosReleased: string | null
	/** Persönliche Worte (Entwurf) – HTML */
	memosDraft: string | null
	/** Nachricht an's TIK – Klartext */
	dogOwnersMessage: string | null
}

function mailRows(model: DogChangeMailModel): MailRow[] {
	const rows: MailRow[] = [
		{ label: 'Benutzer', value: benutzerMailValue(model.user) },
		mailRow('Hund', model.dogName),
	]

	if (isSet(model.kennelName)) {
		rows.push(mailRow('Kennel', model.kennelName))
	}

	rows.push(
		mailRow('Persönliche Worte (veröffentlicht)', model.memosReleased, true),
		mailRow('Persönliche Worte (Entwurf)', model.memosDraft, true),
		mailRow("Nachricht an's TIK", model.dogOwnersMessage),
	)

	return rows
}

export async function sendDogChangeMail(
	strapi: Core.Strapi,
	model: DogChangeMailModel,
): Promise<boolean> {
	const dogName = isSet(model.dogName)
		? readText(model.dogName).trim()
		: '(ohne Hundename)'

	const recipient = await readReportEmail(strapi)
	if (!recipient) {
		strapi.log.info(
			`Zuchthund (${dogName}): keine ReportEmail in den HZD-Settings hinterlegt, Benachrichtigung wird nicht gesendet.`,
		)
		return false
	}

	const subject = `Zuchthundedaten ändern ${dogName}`
	const intro = 'Ein eingeloggter Benutzer hat Zuchthundedaten gespeichert und die Freigabe angefordert.'
	const rows = mailRows(model)

	await strapi.plugin('email').service('email').send({
		to: recipient,
		subject,
		text: buildMailText(rows, intro),
		html: buildMailHtml(rows, 'Zuchthundedaten geändert', intro),
	})

	strapi.log.info(
		`Zuchthund (${dogName}): Benachrichtigung an ${recipient} gesendet.`,
	)
	return true
}

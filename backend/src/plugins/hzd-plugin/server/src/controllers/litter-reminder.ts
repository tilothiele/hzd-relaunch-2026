import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../utils/document-pagination'

const LITTER_UID = 'plugin::hzd-plugin.litter'
const HZD_SETTING_UID = 'api::hzd-setting.hzd-setting'
const EMAIL_TEMPLATE_UID = 'plugin::email-designer-5.email-designer-template'
const WEEK_OPTIONS = [9, 10, 11, 12] as const

interface TemplatedEmailService {
	sendTemplatedEmail: (
		emailOptions: { to: string; from: string; bcc?: string },
		emailTemplate: { templateReferenceId: number },
		data: Record<string, unknown>,
	) => Promise<unknown>
}

interface ZuchtMailAddresses {
	from: string
	bcc: string
}

interface LitterReminderRow {
	documentId: string
	litter: string
	dateOfBirth: string | null
	email: string | null
	sent: boolean
	planned?: boolean
	reason?: string
}

function isWeekOption(value: number): value is (typeof WEEK_OPTIONS)[number] {
	return (WEEK_OPTIONS as readonly number[]).includes(value)
}

function readBody(body: unknown): Record<string, unknown> | null {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return null
	}
	return body as Record<string, unknown>
}

function readDryRun(body: unknown): boolean {
	return readBody(body)?.dryRun === true
}

function readEmailAddress(body: unknown, key: string): string {
	const source = readBody(body)
	const raw = source?.[key]
	return typeof raw === 'string' ? raw.trim() : ''
}

function isEmailAddress(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function readWeeks(body: unknown): number | null {
	const source = readBody(body)
	if (!source) {
		return null
	}
	const raw = source.weeks
	const parsed = typeof raw === 'number'
		? raw
		: typeof raw === 'string'
			? Number.parseInt(raw, 10)
			: Number.NaN
	return isWeekOption(parsed) ? parsed : null
}

function todayInBerlin(): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Europe/Berlin',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date())
}

function addDays(isoDate: string, days: number): string {
	const [year, month, day] = isoDate.split('-').map(Number)
	const date = new Date(Date.UTC(year, month - 1, day))
	date.setUTCDate(date.getUTCDate() + days)
	return date.toISOString().slice(0, 10)
}

function asTrimmedString(value: unknown): string {
	return typeof value === 'string' ? value.trim() : ''
}

function formatDateDMY(isoDate: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
	if (!match) {
		return isoDate
	}
	const day = Number(match[3])
	const month = Number(match[2])
	const year = match[1]
	return `${day}.${month}.${year}`
}

function litterTemplateData(litter: Record<string, unknown>): Record<string, unknown> {
	const dateOfBirth = asTrimmedString(litter.dateOfBirth)
	return {
		...litter,
		dateOfBirth: dateOfBirth ? formatDateDMY(dateOfBirth) : litter.dateOfBirth,
	}
}

function litterLabel(litter: Record<string, unknown>): string {
	const displayName = asTrimmedString(litter.DisplayName)
	if (displayName) {
		return displayName
	}
	const breeder = litter.breeder
	const kennelName = breeder && typeof breeder === 'object'
		? asTrimmedString((breeder as Record<string, unknown>).kennelName)
		: ''
	const orderLetter = asTrimmedString(litter.OrderLetter)
	const label = [kennelName, orderLetter].filter(Boolean).join(' ')
	return label || asTrimmedString(litter.documentId) || 'Wurf'
}

function breederEmail(litter: Record<string, unknown>): string {
	const breeder = litter.breeder
	if (!breeder || typeof breeder !== 'object') {
		return ''
	}
	return asTrimmedString((breeder as Record<string, unknown>).BreederEmail)
}

async function loadTemplateReferenceId(strapi: Core.Strapi): Promise<number | null> {
	const read = async (status: 'published' | 'draft') => {
		const settings = await strapi.documents(HZD_SETTING_UID).findFirst({
			status,
			fields: ['LitterReminderTemplateId'],
		})
		const value = settings?.LitterReminderTemplateId
		return typeof value === 'number' && Number.isInteger(value) && value > 0
			? value
			: null
	}

	return (await read('published')) ?? (await read('draft'))
}

async function loadZuchtMailAddresses(
	strapi: Core.Strapi,
): Promise<ZuchtMailAddresses> {
	const read = async (status: 'published' | 'draft') => {
		const settings = await strapi.documents(HZD_SETTING_UID).findFirst({
			status,
			fields: ['WebmasterZuchtFromEmail', 'WebmasterZuchtCCEmail'],
		})
		return {
			from: asTrimmedString(settings?.WebmasterZuchtFromEmail),
			bcc: asTrimmedString(settings?.WebmasterZuchtCCEmail),
		}
	}

	const published = await read('published')
	const draft = await read('draft')
	return {
		from: published.from || draft.from,
		bcc: published.bcc || draft.bcc,
	}
}

async function findDueLitters(
	strapi: Core.Strapi,
	cutoffDate: string,
): Promise<Record<string, unknown>[]> {
	const filters = {
		$and: [
			{ LitterStatus: { $eq: 'Littered' } },
			{ dateOfBirth: { $notNull: true } },
			{ dateOfBirth: { $lt: cutoffDate } },
		],
	}
	const populate = {
		breeder: {
			fields: ['documentId', 'kennelName', 'BreederEmail'],
		},
	}
	const pageSize = 100
	const litters: Record<string, unknown>[] = []
	let page = 1

	while (true) {
		const result = await findDocumentsPage<Record<string, unknown>>(
			strapi,
			LITTER_UID,
			{
				filters,
				populate,
				sort: ['dateOfBirth:asc'],
				page,
				pageSize,
			},
		)
		litters.push(...result.results)
		if (page >= result.pagination.pageCount || result.results.length === 0) {
			break
		}
		page += 1
	}

	return litters
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
	async defaults(ctx: { body: unknown }) {
		ctx.body = await loadZuchtMailAddresses(strapi)
	},

	async send(ctx: {
		body?: unknown
		request: { body?: unknown }
		badRequest: (message: string) => unknown
		notFound: (message: string) => unknown
	}) {
		const weeks = readWeeks(ctx.request.body)
		const dryRun = readDryRun(ctx.request.body)
		const from = readEmailAddress(ctx.request.body, 'from')
		const bcc = readEmailAddress(ctx.request.body, 'bcc')
		if (!weeks) {
			return ctx.badRequest('weeks muss 9, 10, 11 oder 12 sein.')
		}
		if (!isEmailAddress(from)) {
			return ctx.badRequest('From muss eine gültige E-Mail-Adresse sein.')
		}
		if (bcc && !isEmailAddress(bcc)) {
			return ctx.badRequest('BCC muss eine gültige E-Mail-Adresse sein.')
		}

		const templateReferenceId = await loadTemplateReferenceId(strapi)
		if (!templateReferenceId) {
			return ctx.badRequest(
				'LitterReminderTemplateId ist in den HZD Settings nicht gesetzt.',
			)
		}

		const template = await strapi.db.query(EMAIL_TEMPLATE_UID).findOne({
			where: { templateReferenceId },
		})
		if (!template) {
			return ctx.notFound(
				`E-Mail-Template ${templateReferenceId} nicht gefunden.`,
			)
		}

		const cutoffDate = addDays(todayInBerlin(), -weeks * 7)
		const litters = await findDueLitters(strapi, cutoffDate)
		const emailDesigner = strapi
			.plugin('email-designer-5')
			.service('email') as TemplatedEmailService
		const results: LitterReminderRow[] = []
		const log: string[] = []
		if (dryRun) {
			log.push('Dry run: es werden keine E-Mails gesendet.')
			log.push(
				`Mindestalter ${weeks} Wochen, Geburt vor ${formatDateDMY(cutoffDate)}, Template ${templateReferenceId}.`,
			)
			log.push(`From ${from}${bcc ? `, BCC ${bcc}` : ''}.`)
		}

		for (const litter of litters) {
			const documentId = asTrimmedString(litter.documentId)
			const label = litterLabel(litter)
			const dateOfBirth = asTrimmedString(litter.dateOfBirth) || null
			const email = breederEmail(litter)
			const birthLabel = dateOfBirth ? formatDateDMY(dateOfBirth) : '–'

			if (!email) {
				results.push({
					documentId,
					litter: label,
					dateOfBirth,
					email: null,
					sent: false,
					reason: 'Keine BreederEmail',
				})
				if (dryRun) {
					log.push(`Übersprungen: "${label}" — Keine BreederEmail`)
				}
				continue
			}

			if (dryRun) {
				log.push(
					`Würde senden: "${label}" (Geburt ${birthLabel}) an ${email}`,
				)
				results.push({
					documentId,
					litter: label,
					dateOfBirth,
					email,
					sent: false,
					planned: true,
				})
				continue
			}

			try {
				const sent = await emailDesigner.sendTemplatedEmail(
					{
						to: email,
						from,
						...(bcc ? { bcc } : {}),
					},
					{ templateReferenceId },
					litterTemplateData(litter),
				)
				if (!sent) {
					results.push({
						documentId,
						litter: label,
						dateOfBirth,
						email,
						sent: false,
						reason: 'E-Mail-Template nicht gefunden',
					})
					continue
				}
				const delivery = sent as {
					accepted?: string[]
					rejected?: string[]
					messageId?: string
					response?: string
				}
				const rejected = Array.isArray(delivery.rejected)
					? delivery.rejected
					: []
				if (rejected.length > 0) {
					results.push({
						documentId,
						litter: label,
						dateOfBirth,
						email,
						sent: false,
						reason: `SMTP hat abgelehnt: ${rejected.join(', ')}`,
					})
					continue
				}
				const smtpHost = strapi.config.get('plugin::email.providerOptions.host')
				const smtpPort = strapi.config.get('plugin::email.providerOptions.port')
				strapi.log.info(
					`Wurf-Erinnerung an ${email} von ${from}${bcc ? ` bcc ${bcc}` : ''}`
					+ ` über SMTP ${String(smtpHost)}:${String(smtpPort)} angenommen`
					+ ` (${delivery.messageId ?? 'ohne messageId'}): ${delivery.response ?? 'keine Antwort'}`,
				)
				results.push({
					documentId,
					litter: label,
					dateOfBirth,
					email,
					sent: true,
				})
			} catch (error) {
				const message = error instanceof Error
					? error.message
					: 'Versand fehlgeschlagen'
				strapi.log.error(
					`Wurf-Erinnerung für ${documentId} an ${email} fehlgeschlagen: ${message}`,
				)
				results.push({
					documentId,
					litter: label,
					dateOfBirth,
					email,
					sent: false,
					reason: 'Versand fehlgeschlagen',
				})
			}
		}

		if (dryRun) {
			const plannedCount = results.filter((row) => row.planned).length
			const skippedCount = results.length - plannedCount
			log.push(
				`Abgeschlossen: ${plannedCount} würden gesendet, ${skippedCount} übersprungen.`,
			)
			for (const line of log) {
				strapi.log.info(`Wurf-Erinnerung ${line}`)
			}
		}

		ctx.body = {
			weeks,
			cutoffDate,
			templateReferenceId,
			dryRun,
			log,
			results,
		}
	},
})

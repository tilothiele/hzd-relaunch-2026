/**
 * passed-dog controller
 *
 * Öffentliche REST-Liste nur Einträge mit Consent.
 * HealthInfo bleibt intern und wird öffentlich nicht ausgeliefert.
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'

function isPrivilegedRequest(ctx: {
	get?: (name: string) => string
	request?: { header?: { authorization?: string } }
	state?: {
		auth?: { strategy?: { name?: string } }
		user?: { isSuperAdmin?: boolean }
	}
}): boolean {
	const strategy = ctx.state?.auth?.strategy?.name
	if (strategy === 'api-token' || strategy === 'admin') {
		return true
	}
	if (ctx.state?.user?.isSuperAdmin === true) {
		return true
	}
	const authorization = ctx.get?.('authorization')
		?? ctx.request?.header?.authorization
		?? ''
	return authorization.toLowerCase().startsWith('bearer ')
}

function restrictToPublicListing(ctx: { query?: Record<string, unknown> }) {
	const query = ctx.query ?? {}
	const existingFilters = query.filters
	const listingFilter = {
		$and: [
			{ Consent: { $eq: true } },
			{ Approved: { $eq: true } },
		],
	}
	const hasExisting = Boolean(
		existingFilters
		&& typeof existingFilters === 'object'
		&& Object.keys(existingFilters as object).length > 0,
	)
	ctx.query = {
		...query,
		filters: hasExisting
			? { $and: [existingFilters, listingFilter] }
			: listingFilter,
	}
}

function omitInternalFields(payload: unknown): unknown {
	const strip = (item: unknown): unknown => {
		if (!item || typeof item !== 'object' || Array.isArray(item)) {
			return item
		}
		const record = { ...(item as Record<string, unknown>) }
		delete record.HealthInfo
		delete record.ClientIP
		delete record.EMail
		return record
	}

	if (!payload || typeof payload !== 'object') {
		return payload
	}
	const body = payload as { data?: unknown }
	if (Array.isArray(body.data)) {
		return { ...body, data: body.data.map(strip) }
	}
	if (body.data && typeof body.data === 'object') {
		return { ...body, data: strip(body.data) }
	}
	return payload
}

const PASSED_DOG_UID = 'api::passed-dog.passed-dog' as const
const HZD_SETTING_UID = 'api::hzd-setting.hzd-setting' as const

interface TemplatedEmailService {
	sendTemplatedEmail: (
		emailOptions: { to: string },
		emailTemplate: { templateReferenceId: number },
		data: Record<string, unknown>,
	) => Promise<unknown>
}

function readRequestValue(
	body: unknown,
	query: unknown,
	key: string,
): unknown {
	if (body && typeof body === 'object' && !Array.isArray(body)) {
		const record = body as Record<string, unknown>
		const direct = record[key]
		if (direct !== undefined && direct !== null && direct !== '') {
			return direct
		}
		const data = record.data
		if (data && typeof data === 'object' && !Array.isArray(data)) {
			const nested = (data as Record<string, unknown>)[key]
			if (nested !== undefined && nested !== null && nested !== '') {
				return nested
			}
		}
	}
	if (!query || typeof query !== 'object' || Array.isArray(query)) {
		return undefined
	}
	const queryValue = (query as Record<string, unknown>)[key]
	if (Array.isArray(queryValue)) {
		return queryValue[0]
	}
	return queryValue
}

function toPositiveInteger(value: unknown): number | null {
	if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
		return value
	}
	return null
}

function toPassedDogId(value: unknown): string {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value)
	}
	if (typeof value === 'string') {
		return value.trim()
	}
	return ''
}

async function findPassedDog(
	strapi: Core.Strapi,
	passedDogId: string,
) {
	const byDocumentId = await strapi.documents(PASSED_DOG_UID).findOne({
		documentId: passedDogId,
		populate: { Avatar: true },
	})
	if (byDocumentId) {
		return byDocumentId
	}
	if (!/^\d+$/.test(passedDogId)) {
		return null
	}
	return strapi.db.query(PASSED_DOG_UID).findOne({
		where: { id: Number.parseInt(passedDogId, 10) },
		populate: { Avatar: true },
	})
}

async function loadTotmeldungSettings(strapi: Core.Strapi): Promise<{
	email: string
	templateReferenceId: number | null
}> {
	const read = async (status: 'published' | 'draft') => {
		return strapi.documents(HZD_SETTING_UID).findFirst({
			status,
			fields: ['TotmeldungEmail', 'TotmeldungTemplateId'],
		})
	}

	const published = await read('published')
	const draft = await read('draft')
	return {
		email: published?.TotmeldungEmail?.trim()
			|| draft?.TotmeldungEmail?.trim()
			|| '',
		templateReferenceId: toPositiveInteger(published?.TotmeldungTemplateId)
			?? toPositiveInteger(draft?.TotmeldungTemplateId),
	}
}

export default factories.createCoreController(
	'api::passed-dog.passed-dog',
	({ strapi }: { strapi: Core.Strapi }) => ({
		async find(ctx) {
			if (!isPrivilegedRequest(ctx)) {
				restrictToPublicListing(ctx)
			}
			const result = await super.find(ctx)
			if (!isPrivilegedRequest(ctx)) {
				return omitInternalFields(result)
			}
			return result
		},

		async findOne(ctx) {
			if (!isPrivilegedRequest(ctx)) {
				restrictToPublicListing(ctx)
			}
			const result = await super.findOne(ctx)
			if (!isPrivilegedRequest(ctx)) {
				return omitInternalFields(result)
			}
			return result
		},

		async sendTotmeldung(ctx) {
			const passedDogId = toPassedDogId(
				readRequestValue(
					ctx.request.body,
					ctx.query,
					'passed-dog-id',
				),
			)

			if (!passedDogId) {
				return ctx.badRequest('passed-dog-id ist erforderlich.')
			}

			const passedDog = await findPassedDog(strapi, passedDogId)
			if (!passedDog) {
				return ctx.notFound('PassedDog nicht gefunden.')
			}

			const { email: recipient, templateReferenceId } =
				await loadTotmeldungSettings(strapi)
			if (!templateReferenceId) {
				return ctx.badRequest(
					'TotmeldungTemplateId ist in den HZD Settings nicht gesetzt.',
				)
			}
			if (!recipient) {
				return ctx.badRequest(
					'TotmeldungEmail ist in den HZD Settings nicht gesetzt.',
				)
			}

			try {
				const emailDesigner = strapi
					.plugin('email-designer-5')
					.service('email') as TemplatedEmailService
				const sent = await emailDesigner.sendTemplatedEmail(
					{ to: recipient },
					{ templateReferenceId },
					{ ...passedDog },
				)
				if (!sent) {
					return ctx.notFound(
						`E-Mail-Template ${templateReferenceId} nicht gefunden.`,
					)
				}
			} catch (error) {
				const message = error instanceof Error
					? error.message
					: 'Totmeldung konnte nicht gesendet werden.'
				strapi.log.error(
					`Totmeldung für PassedDog ${passedDogId} fehlgeschlagen: ${message}`,
				)
				return ctx.internalServerError(
					'Totmeldung konnte nicht gesendet werden.',
				)
			}

			return { data: { sent: true } }
		},
	}),
)

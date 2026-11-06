/**
 *  Zuchtleitung (Gruppen-Key "zuchtleitung")
 *  - Liste aktiver Zwingernamen mit Deaktivierungsschalter
 *  - Toggle des Disable-Flags eines Zwingers
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { findDocumentsPage } from '../utils/document-pagination'

const BREEDER_UID = 'plugin::hzd-plugin.breeder'
const ZUCHTLEITUNG_GROUP_KEY = 'zuchtleitung'

const VALID_BREEDER_ROLES = ['B', 'S'] as const

async function loadUserFromRequest(strapi: Core.Strapi, ctx: any) {
	const jwtService = strapi.plugin('users-permissions')?.service('jwt')
	if (!jwtService?.getToken) {
		return null
	}

	try {
		const payload = await jwtService.getToken(ctx)
		const userId = payload?.id
		if (userId == null) {
			return null
		}

		return strapi.db.query('plugin::users-permissions.user').findOne({
			where: { id: userId },
			populate: { user_groups: true },
		})
	} catch {
		return null
	}
}

function userIsZuchtleitung(user: { user_groups?: unknown } | null): boolean {
	if (!user) {
		return false
	}

	const groups = Array.isArray(user.user_groups) ? user.user_groups : []
	return groups.some((group) => {
		if (!group || typeof group !== 'object') {
			return false
		}
		const record = group as Record<string, unknown>
		return typeof record.key === 'string'
			&& record.key.trim().toLowerCase() === ZUCHTLEITUNG_GROUP_KEY
	})
}

const toInt = (value: unknown, fallback: number): number => {
	if (typeof value !== 'string' && typeof value !== 'number') {
		return fallback
	}
	const parsed = Number.parseInt(String(value), 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const coreControllerFactory = factories.createCoreController(
	BREEDER_UID,
	({ strapi }: { strapi: Core.Strapi }) => ({
		/**
		 * Aktive Zwinger (IsActive = true) mit optionalen Filtern:
		 * - role: BreederRole "B" (Züchter) oder "S" (Deckrüdenbesitzer)
		 * - disabledOnly: nur Einträge mit Disable = true (ausgeblendete Züchter)
		 */
		async breeders(ctx: any) {
			const user = await loadUserFromRequest(strapi, ctx)
			if (!user) {
				return ctx.unauthorized('Nicht authentifiziert.')
			}

			if (!userIsZuchtleitung(user)) {
				return ctx.forbidden('Nur für Mitglieder der Zuchtleitung.')
			}

			const query = (ctx?.query ?? {}) as Record<string, unknown>
			const page = toInt(query.page, 1)
			const pageSize = toInt(query.pageSize, 10)

			const role = typeof query.role === 'string'
				? query.role.trim().toUpperCase()
				: ''
			const disabledOnly = query.disabledOnly === 'true'

			const conditions: Array<Record<string, unknown>> = [
				{ IsActive: { $eq: true } },
			]
			if ((VALID_BREEDER_ROLES as readonly string[]).includes(role)) {
				conditions.push({ BreederRole: { $eq: role } })
			}
			if (disabledOnly) {
				conditions.push({ Disable: { $eq: true } })
			}

			const { results, pagination } = await findDocumentsPage(
				strapi,
				BREEDER_UID,
				{
					filters: { $and: conditions },
					populate: { Address: true },
					sort: ['kennelName:asc'],
					page,
					pageSize,
				},
			)

			return {
				data: results,
				meta: { pagination },
			}
		},

		/**
		 * Disable-Flag eines Zwingers umschalten.
		 * Erwartet { data: { Disable: boolean } } (oder { Disable: boolean }).
		 */
		async toggleDisable(ctx: any) {
			const user = await loadUserFromRequest(strapi, ctx)
			if (!user) {
				return ctx.unauthorized('Nicht authentifiziert.')
			}

			if (!userIsZuchtleitung(user)) {
				return ctx.forbidden('Nur für Mitglieder der Zuchtleitung.')
			}

			const documentId = typeof ctx.params?.id === 'string' ? ctx.params.id : ''
			if (!documentId) {
				return ctx.badRequest('Missing breeder id.')
			}

			const body = ctx.request?.body
			const input = body && typeof body === 'object' && !Array.isArray(body)
				&& body.data && typeof body.data === 'object' && !Array.isArray(body.data)
				? body.data
				: body
			const raw = input && typeof input === 'object'
				? (input as Record<string, unknown>).Disable
				: undefined
			if (typeof raw !== 'boolean') {
				return ctx.badRequest('Expected "Disable" as boolean value.')
			}

			const updateData: Record<string, unknown> = { Disable: raw }

			const entity = await strapi.documents(BREEDER_UID).update({
				documentId,
				data: updateData,
			})

			return { data: entity }
		},
	}),
)

export default ({ strapi }: { strapi: Core.Strapi }) => coreControllerFactory({ strapi })

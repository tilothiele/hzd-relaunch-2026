/**
 * page controller
 */

import { factories } from '@strapi/strapi'
import {
	getReindexState,
	handleSearchWebhook,
	isSearchEnabled,
	readBearerOrHeader,
	reindexAll,
	tokensMatch,
} from '../../../search/search-index'

function headerValue(value: unknown): string | undefined {
	if (typeof value === 'string') {
		return value
	}
	if (Array.isArray(value) && typeof value[0] === 'string') {
		return value[0]
	}
	return undefined
}

export default factories.createCoreController('api::page.page', ({ strapi }) => ({
	async reindex(ctx) {
		if (!isSearchEnabled()) {
			ctx.status = 503
			ctx.body = {
				error: {
					status: 503,
					message: 'Meilisearch ist nicht konfiguriert (MEILI_HOST)',
				},
			}
			return
		}

		const expected = process.env.SEARCH_INDEX_TOKEN
		if (!expected) {
			ctx.status = 503
			ctx.body = {
				error: {
					status: 503,
					message: 'SEARCH_INDEX_TOKEN ist nicht konfiguriert',
				},
			}
			return
		}

		const provided = readBearerOrHeader(
			{
				authorization: headerValue(ctx.request.header.authorization),
				'x-search-token': headerValue(ctx.request.header['x-search-token']),
			},
			'x-search-token',
		)

		if (!tokensMatch(provided, expected)) {
			ctx.status = 401
			ctx.body = {
				error: {
					status: 401,
					message: 'Ungültiges Token',
				},
			}
			return
		}

		if (getReindexState().running) {
			ctx.status = 409
			ctx.body = {
				message: 'Vollindexierung läuft bereits',
				status: getReindexState(),
			}
			return
		}

		try {
			const status = await reindexAll(strapi)
			ctx.status = 200
			ctx.body = {
				message: 'Vollindexierung abgeschlossen',
				status,
			}
		} catch (error) {
			strapi.log.error('[Search] Vollindexierung fehlgeschlagen', error)
			ctx.status = 500
			ctx.body = {
				error: {
					status: 500,
					message: 'Vollindexierung fehlgeschlagen',
				},
				status: getReindexState(),
			}
		}
	},

	async webhook(ctx) {
		if (!isSearchEnabled()) {
			ctx.status = 503
			ctx.body = {
				error: {
					status: 503,
					message: 'Meilisearch ist nicht konfiguriert (MEILI_HOST)',
				},
			}
			return
		}

		const expected = process.env.SEARCH_WEBHOOK_SECRET
		if (!expected) {
			ctx.status = 503
			ctx.body = {
				error: {
					status: 503,
					message: 'SEARCH_WEBHOOK_SECRET ist nicht konfiguriert',
				},
			}
			return
		}

		const provided = headerValue(ctx.request.header['x-search-webhook-secret'])
		if (!tokensMatch(provided, expected)) {
			ctx.status = 401
			ctx.body = {
				error: {
					status: 401,
					message: 'Ungültiges Webhook-Secret',
				},
			}
			return
		}

		const body = ctx.request.body
		if (!body || typeof body !== 'object' || Array.isArray(body)) {
			ctx.status = 400
			ctx.body = {
				error: {
					status: 400,
					message: 'Webhook-Payload fehlt',
				},
			}
			return
		}

		try {
			const result = await handleSearchWebhook(strapi, body as Record<string, unknown>)
			ctx.status = 200
			ctx.body = { ok: true, ...result }
		} catch (error) {
			strapi.log.error('[Search] Webhook-Update fehlgeschlagen', error)
			ctx.status = 500
			ctx.body = {
				error: {
					status: 500,
					message: 'Index-Update fehlgeschlagen',
				},
			}
		}
	},
}))

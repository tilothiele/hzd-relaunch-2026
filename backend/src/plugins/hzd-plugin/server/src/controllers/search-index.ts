import type { Core } from '@strapi/strapi'

interface SearchApi {
	reindexAll: (strapi: Core.Strapi) => Promise<{
		running: boolean
		lastFinishedAt: string | null
		lastError: string | null
		indexed: number
		removed: number
	}>
	getReindexState: () => {
		running: boolean
		lastFinishedAt: string | null
		lastError: string | null
		indexed: number
		removed: number
	}
	isSearchEnabled: () => boolean
}

function searchApi(strapi: Core.Strapi): SearchApi | null {
	const api = (strapi as Core.Strapi & { hzdSearch?: SearchApi }).hzdSearch
	return api ?? null
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
	async status(ctx: any) {
		const search = searchApi(strapi)
		ctx.status = 200
		ctx.body = {
			enabled: Boolean(search?.isSearchEnabled()),
			status: search?.getReindexState() ?? null,
		}
	},

	async reindex(ctx: any) {
		const search = searchApi(strapi)
		if (!search?.isSearchEnabled()) {
			ctx.status = 503
			ctx.body = {
				error: {
					status: 503,
					message: 'Meilisearch ist nicht konfiguriert (MEILI_HOST)',
				},
			}
			return
		}

		if (search.getReindexState().running) {
			ctx.status = 409
			ctx.body = {
				error: {
					status: 409,
					message: 'Vollindexierung läuft bereits',
				},
				status: search.getReindexState(),
			}
			return
		}

		try {
			const status = await search.reindexAll(strapi)
			ctx.status = 200
			ctx.body = {
				message: 'Vollindexierung abgeschlossen',
				status,
			}
		} catch (error) {
			strapi.log.error('[Search] Vollindexierung aus dem Admin fehlgeschlagen', error)
			ctx.status = 500
			ctx.body = {
				error: {
					status: 500,
					message: 'Vollindexierung fehlgeschlagen',
				},
				status: search.getReindexState(),
			}
		}
	},
})

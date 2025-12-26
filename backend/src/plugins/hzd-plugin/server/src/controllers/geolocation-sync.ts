import type { Core } from '@strapi/strapi'

export default ({ strapi }: { strapi: Core.Strapi }) => ({
	/**
	 * Trigger geolocation sync manually
	 * GET /hzd-plugin/geolocation-sync/trigger
	 * POST /api/hzd-plugin/geolocation-sync/trigger
	 */
	async trigger(ctx: any) {
		try {
			const service = strapi.plugin('hzd-plugin')?.service('geolocation-sync')

			if (!service) {
				ctx.status = 400
				ctx.body = {
					error: {
						status: 400,
						message: 'Geolocation sync service not available',
					},
				}
				return
			}

			// Check if already running
			const status = service.getStatus()
			if (status.isRunning) {
				ctx.status = 409
				ctx.body = {
					message: 'Geolocation sync is already running',
					status,
				}
				return
			}

			// Trigger sync (non-blocking)
			service.syncGeolocations().catch((error: any) => {
				strapi.log.error('[Geolocation Sync] Error in manual trigger:', error)
			})

			ctx.status = 202
			ctx.body = {
				message: 'Geolocation sync triggered',
				status: service.getStatus(),
			}
		} catch (error: any) {
			strapi.log.error('[Geolocation Sync] Error triggering sync:', error)
			ctx.status = 500
			ctx.body = {
				error: {
					status: 500,
					message: 'Failed to trigger geolocation sync',
				},
			}
		}
	},

	/**
	 * Get geolocation sync status
	 * GET /hzd-plugin/geolocation-sync/status
	 * GET /api/hzd-plugin/geolocation-sync/status
	 */
	async status(ctx: any) {
		try {
			const service = strapi.plugin('hzd-plugin')?.service('geolocation-sync')

			if (!service) {
				ctx.status = 400
				ctx.body = {
					error: {
						status: 400,
						message: 'Geolocation sync service not available',
					},
				}
				return
			}

			ctx.status = 200
			ctx.body = {
				status: service.getStatus(),
			}
		} catch (error: any) {
			strapi.log.error('[Geolocation Sync] Error getting status:', error)
			ctx.status = 500
			ctx.body = {
				error: {
					status: 500,
					message: 'Failed to get geolocation sync status',
				},
			}
		}
	},
})


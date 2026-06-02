import type { Core } from '@strapi/strapi';
import cron from 'node-cron';
import { extendJWT } from './extend-jwt';
import { initPermissions, waitForUsersPermissions } from './init-permissions';
import { setupRoles } from './setup-roles';
import { enrichBreederRecords } from './utils/breeder-enrich';

function patchBreederController(strapi: Core.Strapi) {
	const breederController = strapi
		.plugin('hzd-plugin')
		.controller('breeder') as Record<string, any> | undefined

	if (!breederController) {
		strapi.log.warn('[HZD Plugin] Breeder controller not found for enrichment patch')
		return
	}

	for (const action of ['find', 'findOne'] as const) {
		const original = breederController[action]

		if (typeof original !== 'function') {
			continue
		}

		breederController[action] = async (ctx: any) => {
			const response = await original.call(breederController, ctx)

			if (response?.data) {
				response.data = await enrichBreederRecords(strapi, response.data)
			}

			return response
		}
	}

	strapi.log.info('[HZD Plugin] Breeder API enrichment patch applied')
}

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
	// Erweitere JWT-Service mit member und officer_roles
	await extendJWT(strapi);
	patchBreederController(strapi)

	// Warte kurz, damit Strapi vollständig initialisiert ist
	await new Promise((resolve) => setTimeout(resolve, 2000))

	try {
		const usersPermissionsReady = await waitForUsersPermissions(strapi)

		if (!usersPermissionsReady) {
			strapi.log.warn(
				'[HZD Plugin] users-permissions not ready, skipping role/permission setup',
			)
			return
		}

		// Lege Roles an
		await setupRoles(strapi);

		if (process.env.INIT_PERMISSIONS === 'true') {
			await initPermissions(strapi)
		} else {
			strapi.log.info(
				'[HZD Plugin] Permission init skipped (set INIT_PERMISSIONS=true to enable)',
			)
		}

		// Setup Geolocation Sync Cronjob
		// Default: Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
		// Can be configured via GEOLOCATION_SYNC_CRON env variable
		const cronSchedule = process.env.GEOLOCATION_SYNC_CRON || '0 * * * *'
		
		const geolocationSyncService = strapi.plugin('hzd-plugin')?.service('geolocation-sync')
		if (geolocationSyncService) {
			// Schedule the cronjob
			// scheduled: true is the default, so we only need to set timezone
			const task = cron.schedule(
				cronSchedule,
				async () => {
					try {
						await geolocationSyncService.syncGeolocations()
					} catch (error) {
						strapi.log.error('[HZD Plugin] Error in geolocation sync cronjob:', error)
					}
				},
				{
					timezone: 'Europe/Berlin', // Adjust to your timezone
				}
			)

			strapi.log.info(`[HZD Plugin] ✓ Geolocation sync cronjob scheduled: ${cronSchedule}`)
			strapi.log.info('[HZD Plugin]   Use GEOLOCATION_SYNC_CRON env variable to customize schedule')
			strapi.log.info('[HZD Plugin]   Example: GEOLOCATION_SYNC_CRON="0 */2 * * *" (every 2 hours)')
			
			// Store task reference for potential cleanup
			;(strapi as any).geolocationSyncTask = task
		} else {
			strapi.log.warn('[HZD Plugin] Geolocation sync service not found, cronjob not scheduled')
		}
	} catch (error) {
		console.error('[HZD Plugin] Error in bootstrap:', error)
	}
}

export default bootstrap

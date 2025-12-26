import type { Core } from '@strapi/strapi';
import cron from 'node-cron';
import { extendJWT } from './extend-jwt';
import { setupRoles } from './setup-roles';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
	// Erweitere JWT-Service mit member und officer_roles
	await extendJWT(strapi);

	// Warte kurz, damit Strapi vollständig initialisiert ist
	await new Promise((resolve) => setTimeout(resolve, 2000))

	try {
		// Warte, bis users-permissions Plugin vollständig geladen ist
		let retries = 0;
		while (retries < 10) {
			try {
				const testRole = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
				if (testRole) {
					break; // Plugin ist bereit
				}
			} catch (error) {
				// Plugin noch nicht bereit, warte weiter
			}
			await new Promise((resolve) => setTimeout(resolve, 500));
			retries++;
		}

		// Lege Roles an
		await setupRoles(strapi);

		// GraphQL Permissions für alle Content-Types aktivieren
		const publicRole = await strapi
			.query('plugin::users-permissions.role')
			.findOne({
				where: { type: 'public' },
			})

		if (!publicRole) {
			console.log('[HZD Plugin] Public role not found, skipping permission setup')
			return
		}

		console.log('[HZD Plugin] Setting up public permissions...')
		console.log(`[HZD Plugin] Public role ID: ${publicRole.id}`)

		/*
		// Liste aller Content-Types, die öffentlich zugänglich sein sollen
		const contentTypes = [
			{ name: 'dog', actions: ['find', 'findOne'] },
			{ name: 'breeder', actions: ['find', 'findOne'] },
			{ name: 'litter', actions: ['find', 'findOne'] },
			{ name: 'homepage', actions: ['find'] }, // singleType hat nur find
			{ name: 'news-article', actions: ['find', 'findOne'] },
			{ name: 'homepage-section', actions: ['find', 'findOne'] },
			{ name: 'contact', actions: ['find', 'findOne'] },
		]

		// Für jeden Content-Type die Permissions setzen
		for (const contentType of contentTypes) {
			const subject = `plugin::hzd-plugin.${contentType.name}`

			// Erstelle fehlende Permissions
			for (const action of contentType.actions) {
				const actionName = `${subject}.${action}`

				try {
					// Prüfe, ob Permission bereits existiert
					const existingPermission = await strapi
						.query('plugin::users-permissions.permission')
						.findOne({
							where: {
								role: publicRole.id,
								action: actionName,
							},
						})

					if (!existingPermission) {
						const created = await strapi
							.query('plugin::users-permissions.permission')
							.create({
								data: {
									action: actionName,
									role: publicRole.id,
								},
							})
						console.log(`[HZD Plugin] ✓ Created permission: ${actionName} (ID: ${created.id})`)
					} else {
						console.log(`[HZD Plugin] - Permission already exists: ${actionName}`)
					}
				} catch (error) {
					console.error(`[HZD Plugin] ✗ Error creating permission ${actionName}:`, error)
				}
			}
		}
			*/

		console.log('[HZD Plugin] Permission setup completed')

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

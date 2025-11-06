import type { Core } from '@strapi/strapi';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
	// Warte kurz, damit Strapi vollständig initialisiert ist
	await new Promise((resolve) => setTimeout(resolve, 1000))

	try {
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
			{ name: 'member', actions: ['find', 'findOne'] },
			{ name: 'litter', actions: ['find', 'findOne'] },
			{ name: 'puppy', actions: ['find', 'findOne'] },
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
	} catch (error) {
		console.error('[HZD Plugin] Error in bootstrap:', error)
	}
}

export default bootstrap

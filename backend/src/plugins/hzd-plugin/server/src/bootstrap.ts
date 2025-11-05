import type { Core } from '@strapi/strapi';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
	// GraphQL Permissions für dog Content-Type aktivieren
	const publicRole = await strapi
		.query('plugin::users-permissions.role')
		.findOne({
			where: { type: 'public' },
		})

	if (publicRole) {
		// Permissions für dog Content-Type finden oder erstellen
		const existingPermissions = await strapi
			.query('plugin::users-permissions.permission')
			.findMany({
				where: {
					role: publicRole.id,
					action: {
						$in: [
							'plugin::hzd-plugin.dog.find',
							'plugin::hzd-plugin.dog.findOne',
						],
					},
				},
			})

		// Prüfe, ob find Permission bereits existiert
		const hasFind = existingPermissions.some(
			(p) => p.action === 'plugin::hzd-plugin.dog.find'
		)
		const hasFindOne = existingPermissions.some(
			(p) => p.action === 'plugin::hzd-plugin.dog.findOne'
		)

		// Erstelle fehlende Permissions
		if (!hasFind) {
			await strapi
				.query('plugin::users-permissions.permission')
				.create({
					data: {
						action: 'plugin::hzd-plugin.dog.find',
						subject: 'plugin::hzd-plugin.dog',
						role: publicRole.id,
					},
				})
		}

		if (!hasFindOne) {
			await strapi
				.query('plugin::users-permissions.permission')
				.create({
					data: {
						action: 'plugin::hzd-plugin.dog.findOne',
						subject: 'plugin::hzd-plugin.dog',
						role: publicRole.id,
					},
				})
		}
	}
}

export default bootstrap

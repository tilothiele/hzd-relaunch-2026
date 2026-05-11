/**
 * Direktes Skript zum Setzen der Permissions
 * Führe aus: pnpm strapi console
 * Dann: require('./src/plugins/hzd-plugin/server/src/fix-permissions').default(strapi)
 */

import type { Core } from '@strapi/strapi'

export default async function fixPermissions(strapi: Core.Strapi) {
	console.log('🔧 Fixing permissions...\n')

	const publicRole = await strapi
		.query('plugin::users-permissions.role')
		.findOne({
			where: { type: 'public' },
		})

	if (!publicRole) {
		console.log('❌ Public role not found!')
		return
	}

	console.log(`✓ Public role found (ID: ${publicRole.id})\n`)

	// Wichtigste Permissions zuerst
	const permissions = [
		'plugin::hzd-plugin.homepage.find',
		'plugin::hzd-plugin.news-article.find',
		'plugin::hzd-plugin.news-article.findOne',
		'plugin::hzd-plugin.homepage-section.find',
		'plugin::hzd-plugin.homepage-section.findOne',
		'plugin::hzd-plugin.contact.find',
		'plugin::hzd-plugin.contact.findOne',
		'plugin::hzd-plugin.dog.find',
		'plugin::hzd-plugin.dog.findOne',
		'plugin::hzd-plugin.breeder.find',
		'plugin::hzd-plugin.breeder.findOne',
		'plugin::hzd-plugin.litter.find',
		'plugin::hzd-plugin.litter.findOne',
	]

	let created = 0
	let existingCount = 0
	let errors = 0

	for (const action of permissions) {
		try {
			// Prüfe, ob Permission existiert (public role)
			const existingPermission = await strapi
				.query('plugin::users-permissions.permission')
				.findOne({
					where: {
						role: publicRole.id,
						action,
					},
				})

			if (existingPermission) {
				console.log(`✓ [public] ${action} - already exists`)
				existingCount++
			} else {
				// Erstelle Permission
				await strapi
					.query('plugin::users-permissions.permission')
					.create({
						data: {
							action,
							role: publicRole.id,
						},
					})
				console.log(`✅ [public] ${action} - CREATED`)
				created++
			}
		} catch (error) {
			console.error(`❌ [public] ${action} - ERROR:`, error.message)
			errors++
		}
	}

	// Auch für authenticated role
	const authenticatedRole = await strapi
		.query('plugin::users-permissions.role')
		.findOne({
			where: { type: 'authenticated' },
		})

	if (authenticatedRole) {
		console.log(`\n✓ Authenticated role found (ID: ${authenticatedRole.id})\n`)

		for (const action of permissions) {
			try {
				const existingPermission = await strapi
					.query('plugin::users-permissions.permission')
					.findOne({
						where: {
							role: authenticatedRole.id,
							action,
						},
					})

				if (existingPermission) {
					console.log(`✓ [authenticated] ${action} - already exists`)
				} else {
					await strapi
						.query('plugin::users-permissions.permission')
						.create({
							data: {
								action,
								role: authenticatedRole.id,
							},
						})
					console.log(`✅ [authenticated] ${action} - CREATED`)
					created++
				}
			} catch (error) {
				console.error(`❌ [authenticated] ${action} - ERROR:`, error.message)
				errors++
			}
		}
	} else {
		console.log('\n⚠️ Authenticated role not found')
	}

	console.log(`\n📊 Summary:`)
	console.log(`   Created: ${created}`)
	console.log(`   Existing: ${existingCount}`)
	console.log(`   Errors: ${errors}`)
	console.log(`\n✅ Done! Please restart Strapi for changes to take effect.`)
}


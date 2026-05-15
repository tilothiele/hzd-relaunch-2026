import type { Core } from '@strapi/strapi'

type PermissionAction = 'find' | 'findOne'

const ROLE_TYPES = ['public', 'authenticated'] as const

function apiActions(uid: string, actions: PermissionAction[]): string[] {
	return actions.map((action) => `api::${uid}.${uid}.${action}`)
}

function pluginActions(uid: string, actions: PermissionAction[]): string[] {
	return actions.map((action) => `plugin::hzd-plugin.${uid}.${action}`)
}

/**
 * Öffentliche Lese-Permissions für Plugin- und API-Content-Types.
 * Erweiterbar über INIT_PERMISSIONS_EXTRA (kommaseparierte action-Strings).
 */
const DEFAULT_PERMISSIONS: string[] = [
	// HZD Plugin
	...pluginActions('dog', ['find', 'findOne']),
	...pluginActions('breeder', ['find', 'findOne']),
	...pluginActions('litter', ['find', 'findOne']),
	...pluginActions('geo-location', ['find', 'findOne']),

	// API – Website-Inhalte
	...apiActions('page', ['find', 'findOne']),
	...apiActions('news-article', ['find', 'findOne']),
	...apiActions('news-article-category', ['find', 'findOne']),
	...apiActions('news-article-tag', ['find', 'findOne']),
	...apiActions('author', ['find', 'findOne']),
	...apiActions('contact', ['find', 'findOne']),
	...apiActions('contact-group', ['find', 'findOne']),
	...apiActions('global-layout', ['find']),
	...apiActions('hzd-setting', ['find']),
	...apiActions('announcement', ['find', 'findOne']),
	...apiActions('calendar', ['find', 'findOne']),
	...apiActions('calendar-entry', ['find', 'findOne']),
	...apiActions('champion', ['find', 'findOne']),
	...apiActions('form', ['find', 'findOne']),
	...apiActions('gallery-image', ['find', 'findOne']),
	...apiActions('passed-dog', ['find', 'findOne']),
	...apiActions('regional-unit', ['find', 'findOne']),
	...apiActions('local-cummunity', ['find', 'findOne']),
	...apiActions('supplemental-document', ['find', 'findOne']),
	...apiActions('supplemental-document-group', ['find', 'findOne']),
	...apiActions('merchandising-product', ['find', 'findOne']),
]

export async function waitForUsersPermissions(
	strapi: Core.Strapi,
	maxRetries = 10,
): Promise<boolean> {
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const publicRole = await strapi
				.query('plugin::users-permissions.role')
				.findOne({ where: { type: 'public' } })

			if (publicRole) {
				return true
			}
		} catch {
			// Plugin noch nicht bereit
		}

		await new Promise((resolve) => setTimeout(resolve, 500))
	}

	return false
}

function resolvePermissionActions(): string[] {
	const extra = process.env.INIT_PERMISSIONS_EXTRA?.trim()

	if (!extra) {
		return DEFAULT_PERMISSIONS
	}

	const extras = extra
		.split(',')
		.map((action) => action.trim())
		.filter(Boolean)

	return [...new Set([...DEFAULT_PERMISSIONS, ...extras])]
}

async function ensurePermissionForRole(
	strapi: Core.Strapi,
	roleId: number,
	roleType: string,
	action: string,
): Promise<'created' | 'existing' | 'error'> {
	try {
		const existingPermission = await strapi
			.query('plugin::users-permissions.permission')
			.findOne({
				where: {
					role: roleId,
					action,
				},
			})

		if (existingPermission) {
			strapi.log.debug(`[HZD Plugin] [${roleType}] ${action} – exists`)
			return 'existing'
		}

		await strapi.query('plugin::users-permissions.permission').create({
			data: {
				action,
				role: roleId,
			},
		})

		strapi.log.info(`[HZD Plugin] [${roleType}] ${action} – created`)
		return 'created'
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		strapi.log.error(`[HZD Plugin] [${roleType}] ${action} – error: ${message}`)
		return 'error'
	}
}

/**
 * Setzt fehlende users-permissions für public und authenticated.
 * Idempotent – vorhandene Einträge werden nicht doppelt angelegt.
 */
export async function initPermissions(strapi: Core.Strapi): Promise<void> {
	const permissions = resolvePermissionActions()

	strapi.log.info(
		`[HZD Plugin] Initializing ${permissions.length} permissions for roles: ${ROLE_TYPES.join(', ')}`,
	)

	let created = 0
	let existing = 0
	let errors = 0

	for (const roleType of ROLE_TYPES) {
		const role = await strapi
			.query('plugin::users-permissions.role')
			.findOne({ where: { type: roleType } })

		if (!role) {
			strapi.log.warn(`[HZD Plugin] Role "${roleType}" not found, skipping`)
			continue
		}

		strapi.log.info(`[HZD Plugin] Role "${roleType}" (ID: ${role.id})`)

		for (const action of permissions) {
			const result = await ensurePermissionForRole(
				strapi,
				role.id,
				roleType,
				action,
			)

			if (result === 'created') {
				created++
			} else if (result === 'existing') {
				existing++
			} else {
				errors++
			}
		}
	}

	strapi.log.info(
		`[HZD Plugin] Permission init done – created: ${created}, existing: ${existing}, errors: ${errors}`,
	)
}

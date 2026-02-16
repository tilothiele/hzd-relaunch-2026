// Extend users-permissions plugin to inject geolocation via document service on create/update
// and extend JWT service with member and officer_roles
export default (plugin: any) => {
	// Store original bootstrap if it exists
	const originalBootstrap = plugin.bootstrap

	// Register bootstrap hook to patch document service after Strapi is fully initialized
	plugin.bootstrap = async ({ strapi }: { strapi: any }) => {
		// Call original bootstrap first if it exists
		if (originalBootstrap && typeof originalBootstrap === 'function') {
			await originalBootstrap({ strapi })
		}

		strapi.log.info('[User Ext] Bootstrap: extending JWT service and patching user document service')

		// Extend User Controller to fix /api/me returning ID instead of DocumentID
		if (plugin.controllers?.user) {
			const originalMe = plugin.controllers.user.me

			plugin.controllers.user.me = async (ctx: any) => {
				const user = ctx.state.user

				if (!user) {
					return ctx.unauthorized()
				}

				try {
					// Use Document Service to fetch user by ID (integer)
					// In Strapi 5, documentId is the main identifier, but auth uses ID (integer)
					const userEntity = await strapi.documents('plugin::users-permissions.user').findFirst({
						where: { id: user.id },
						populate: ['role', 'member'], // Standard populate + member
					})

					if (!userEntity) {
						return ctx.notFound('User not found')
					}

					// Sanitize output
					// Manual sanitization to ensure documentId is preserved if sanitizeOutput strips it (it shouldn't in v5, but purely safety)
					const sanitizedUser = await strapi.contentAPI.sanitize.output(
						userEntity,
						strapi.getModel('plugin::users-permissions.user'),
						{ auth: ctx.state.auth }
					)

					// Force documentId from entity if missing in sanitized output (safeguard)
					if (!sanitizedUser.documentId && userEntity.documentId) {
						sanitizedUser.documentId = userEntity.documentId
					}

					ctx.body = sanitizedUser
				} catch (err) {
					strapi.log.error('[User Ext] Error in custom me controller:', err)
					// Fallback to original controller if something fails
					return originalMe(ctx)
				}
			}

			strapi.log.info('[User Ext] ✓ User Controller extended (me endpoint patch)')
		}

		// Extend JWT Service
		try {
			const jwtService = strapi.plugin('users-permissions')?.service('jwt')

			if (jwtService) {
				// Speichere die originale issue-Methode
				const originalIssue = jwtService.issue.bind(jwtService)

				// Erweitere die issue-Methode
				jwtService.issue = function (payload: any, jwtOptions: any = {}) {
					strapi.log.info('[User Ext] JWT issue called', { hasId: !!payload?.id, payloadKeys: Object.keys(payload || {}) })

					// Wenn payload bereits member enthält, verwende es direkt
					if (payload.member) {
						strapi.log.info('[User Ext] Payload already has member, using original issue')
						return originalIssue(payload, jwtOptions)
					}

					// Prüfe, ob die originale Methode ein Promise zurückgibt (refresh mode)
					const originalResult = originalIssue(payload, jwtOptions)
					strapi.log.info('[User Ext] Original issue result type', {
						isPromise: originalResult instanceof Promise,
						type: typeof originalResult,
						hasValue: !!originalResult
					})

					if (originalResult instanceof Promise) {
						// Asynchroner Modus (refresh mode)
						return originalResult.then(async (token: string) => {
							if (!token || typeof token !== 'string') {
								strapi.log.warn('[User Ext] Invalid token from original issue, skipping extension')
								return token
							}

							// Lade User mit Member und Officer Roles
							try {
								const user = await strapi
									.query('plugin::users-permissions.user')
									.findOne({
										where: { id: payload.id },
										populate: {
											member: {
												populate: {
													officer_roles: true,
												},
											},
										},
									})

								if (!user || !user.member) {
									strapi.log.info('[User Ext] User or member not found, returning original token')
									return token
								}

								// Erweitere Payload mit Member-Daten und generiere neues Token
								const extendedPayload = {
									...payload,
									member: {
										id: user.member.id,
										fullName: user.member.fullName,
										membershipNo: user.member.membershipNo,
										memberSince: user.member.memberSince,
										region: user.member.region,
										officer_roles: user.member.officer_roles
											? user.member.officer_roles.map((role: any) => ({
												id: role.id,
												Name: role.Name,
												RegionalUnit: role.RegionalUnit,
											}))
											: [],
									},
								}

								// Generiere neues Token mit erweitertem Payload
								const extendedTokenResult = originalIssue(extendedPayload, jwtOptions)
								if (extendedTokenResult instanceof Promise) {
									const extendedToken = await extendedTokenResult
									strapi.log.info('[User Ext] Extended JWT token generated', {
										hasToken: !!extendedToken,
										tokenType: typeof extendedToken
									})
									return extendedToken
								} else {
									strapi.log.info('[User Ext] Extended JWT token generated (sync)', {
										hasToken: !!extendedTokenResult,
										tokenType: typeof extendedTokenResult
									})
									return extendedTokenResult
								}
							} catch (error) {
								strapi.log.error('[User Ext] Error extending JWT token:', error)
								// Fallback: Verwende originales Token
								return token
							}
						})
					} else {
						// Synchroner Modus (legacy mode)
						strapi.log.warn('[User Ext] Synchron JWT issue detected, member extension skipped')
						return originalResult
					}
				}

				strapi.log.info('[User Ext] ✓ JWT Service extended with member and officer_roles')
			} else {
				strapi.log.warn('[User Ext] JWT Service not found, skipping JWT extension')
			}
		} catch (error) {
			strapi.log.error('[User Ext] Error extending JWT Service:', error)
		}

		strapi.log.info('[User Ext] Bootstrap: JWT service extension complete');
	}

	return plugin
}

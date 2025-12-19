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

		// Extend JWT Service
		try {
			const jwtService = strapi.plugin('users-permissions')?.service('jwt')
			
			if (jwtService) {
				// Speichere die originale issue-Methode
				const originalIssue = jwtService.issue.bind(jwtService)

				// Erweitere die issue-Methode
				jwtService.issue = function(payload: any, jwtOptions: any = {}) {
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

		strapi.log.info('[User Ext] Bootstrap: patching user document service')

		const geolocationService = () => strapi.plugin('hzd-plugin')?.service('geolocation')

		const enrichWithGeo = async (data: any) => {
			if (!data || typeof data.zip !== 'string' || data.zip.trim() === '') {
				return
			}

			const geo = geolocationService()
			if (!geo) {
				strapi.log.warn('[User Ext] Geolocation service not available')
				return
			}

			strapi.log.info('[User Ext] fetching geolocation for zip', { zip: data.zip })
			const result = await geo.getGeoLocationByZip(data.zip)
			if (result) {
				data.geoLocation = { lat: result.lat, lng: result.lng }
				strapi.log.info('[User Ext] geolocation set via document override', {
					zip: data.zip,
					geo: data.geoLocation,
				})
			} else {
				strapi.log.warn('[User Ext] geolocation lookup failed; leaving geoLocation unchanged', {
					zip: data.zip,
				})
			}
		}

		// Wait a bit for document service to be ready
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Patch document service for users-permissions user
		try {
			const userDocService = strapi.documents?.('plugin::users-permissions.user')
			if (userDocService) {
				const originalCreate = userDocService.create?.bind(userDocService)
				const originalUpdate = userDocService.update?.bind(userDocService)

				if (originalCreate) {
					userDocService.create = async (params: any, opts?: any) => {
						strapi.log.info('[User Ext] create intercepted', { hasData: !!params?.data, zip: params?.data?.zip })
						await enrichWithGeo(params?.data)
						return originalCreate(params, opts)
					}
					strapi.log.info('[User Ext] patched user document service create')
				}

				if (originalUpdate) {
					userDocService.update = async (params: any, opts?: any) => {
						strapi.log.info('[User Ext] update intercepted', { hasData: !!params?.data, zip: params?.data?.zip })
						await enrichWithGeo(params?.data)
						return originalUpdate(params, opts)
					}
					strapi.log.info('[User Ext] patched user document service update')
				}
			} else {
				strapi.log.warn('[User Ext] user document service not available in bootstrap')
			}
		} catch (error) {
			strapi.log.error('[User Ext] failed to patch user document service', error)
		}
	}

	return plugin
}

// Extend users-permissions plugin to inject geolocation via document service on create/update
export default (plugin: any) => {
	// Register bootstrap hook to patch document service after Strapi is fully initialized
	plugin.bootstrap = async ({ strapi }: { strapi: any }) => {
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


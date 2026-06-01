/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'

export default factories.createCoreController(
	'plugin::hzd-plugin.dog',
	({ strapi }: { strapi: Core.Strapi }) => {
		const service = strapi.service('plugin::hzd-plugin.dog')

		return {
			async find(ctx: any) {
				const { lat, lng } = ctx.query ?? {}
				if (lat && lng) {
					return service.find(ctx)
				}

				return Object.getPrototypeOf(this).find.call(this, ctx)
			},
		}
	},
)

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
				return service.find(ctx)
			},
		}
	},
)

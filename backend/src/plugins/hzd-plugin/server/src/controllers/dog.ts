/**
 *  controller
 */

import type { Core } from '@strapi/strapi'
import { factories } from '@strapi/strapi'

const coreController = factories.createCoreController('plugin::hzd-plugin.dog')

export default ({ strapi }: { strapi: Core.Strapi }) => {
	const defaultController = coreController({ strapi })

	return {
		...defaultController,
		async find(ctx: any) {
			const service = strapi.plugin('hzd-plugin').service('dog')
			return service.find(ctx)
		},
	}
}



/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core, UID } from '@strapi/strapi'

type DogController = Core.CoreAPI.Controller.ContentType<UID.ContentType>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultController = factories.createCoreController('plugin::hzd-plugin.dog') as any

export default ({ strapi }: { strapi: Core.Strapi }): DogController => {
	const service = strapi.service('plugin::hzd-plugin.dog')

	return {
		...defaultController({ strapi }),
		async find(ctx) {
			return service.find(ctx)
		},
		async findOne(ctx) {
			return service.findOne(ctx)
		},
		async create(ctx) {
			return service.create(ctx)
		},
		async update(ctx) {
			return service.update(ctx)
		},
	}
}



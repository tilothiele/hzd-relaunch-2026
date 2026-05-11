/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyController = Record<string, any>

const coreControllerFactory = factories.createCoreController('plugin::hzd-plugin.dog')

export default ({ strapi }: { strapi: Core.Strapi }): AnyController => {
	const service = strapi.service('plugin::hzd-plugin.dog')

	return {
		...(coreControllerFactory({ strapi } as any) as AnyController),
		async find(ctx: any) {
			return service.find(ctx)
		},
		async findOne(ctx: any) {
			return service.findOne(ctx)
		},
		async create(ctx: any) {
			return service.create(ctx)
		},
		async update(ctx: any) {
			return service.update(ctx)
		},
	}
}
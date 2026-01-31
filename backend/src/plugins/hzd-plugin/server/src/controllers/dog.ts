/**
 *  controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('plugin::hzd-plugin.dog', ({ strapi }) => ({
	async find(ctx) {
		const service = strapi.service('plugin::hzd-plugin.dog') as any
		return service.find(ctx)
	},
	async findOne(ctx) {
		const service = strapi.service('plugin::hzd-plugin.dog') as any
		return service.findOne(ctx)
	},
	async create(ctx) {
		const service = strapi.service('plugin::hzd-plugin.dog') as any
		return service.create(ctx)
	},
	async update(ctx) {
		const service = strapi.service('plugin::hzd-plugin.dog') as any
		return service.update(ctx)
	},
}));



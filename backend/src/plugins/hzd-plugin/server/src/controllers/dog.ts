/**
 *  controller
 */

import { factories } from '@strapi/strapi'

const defaultController = factories.createCoreController('plugin::hzd-plugin.dog')

export default {
	...defaultController,
	async find(ctx) {
		const service = strapi.service('plugin::hzd-plugin.dog')
		return service.find(ctx)
	},
	async findOne(ctx) {
		const service = strapi.service('plugin::hzd-plugin.dog')
		return service.findOne(ctx)
	},
	async create(ctx) {
		const service = strapi.service('plugin::hzd-plugin.dog')
		return service.create(ctx)
	},
	async update(ctx) {
		const service = strapi.service('plugin::hzd-plugin.dog')
		return service.update(ctx)
	},
}



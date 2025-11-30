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
		return defaultController.findOne(ctx)
	},
}



/**
 *  controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { enrichBreederRecords } from '../utils/breeder-enrich'

const coreControllerFactory = factories.createCoreController(
	'plugin::hzd-plugin.breeder',
	({ strapi }: { strapi: Core.Strapi }) => ({
		async find(ctx: any) {
			const response = await Object.getPrototypeOf(this).find.call(this, ctx)

			if (response?.data) {
				response.data = await enrichBreederRecords(strapi, response.data)
			}

			return response
		},

		async findOne(ctx: any) {
			const response = await Object.getPrototypeOf(this).findOne.call(this, ctx)

			if (response?.data) {
				response.data = await enrichBreederRecords(strapi, response.data)
			}

			return response
		},
	}),
)

export default ({ strapi }: { strapi: Core.Strapi }) => coreControllerFactory({ strapi })

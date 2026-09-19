/**
 * hzd-form-instance controller
 */

import { factories } from '@strapi/strapi'
import { applyClientIp } from '../../../utils/client-ip'

export default factories.createCoreController(
	'api::hzd-form-instance.hzd-form-instance',
	() => ({
		async create(ctx) {
			const data = ctx.request.body?.data
			if (data && typeof data === 'object') {
				applyClientIp(data as Record<string, unknown>, ctx)
			}

			return super.create(ctx)
		},
	}),
)

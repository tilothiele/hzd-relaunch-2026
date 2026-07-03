/**
 * hzd-setting controller
 *
 * Überschreibt den Default-`find` so, dass `populate` implizit aus dem
 * hzd-setting-populate Service gesetzt wird. Eingehende Query-Parameter
 * bleiben erhalten und werden mit dem Default-Populate zusammengeführt.
 */

import { factories } from '@strapi/strapi'
import { buildHzdSettingPopulate } from '../services/hzd-setting-populate'

export default factories.createCoreController(
	'api::hzd-setting.hzd-setting',
	() => ({
		async find(ctx) {
			ctx.query = {
				...ctx.query,
				...buildHzdSettingPopulate(),
			}

			return Object.getPrototypeOf(this).find.call(this, ctx)
		},
	}),
)
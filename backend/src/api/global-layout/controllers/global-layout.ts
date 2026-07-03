/**
 * global-layout controller
 *
 * Überschreibt den Default-`find` so, dass `populate` implizit aus dem
 * global-layout-populate Service gesetzt wird. Eingehende Query-Parameter
 * bleiben erhalten und werden mit dem Default-Populate zusammengeführt.
 */

import { factories } from '@strapi/strapi'
import { buildGlobalLayoutPopulate } from '../services/global-layout-populate'

export default factories.createCoreController(
	'api::global-layout.global-layout',
	() => ({
		async find(ctx) {
			ctx.query = {
				...ctx.query,
				...buildGlobalLayoutPopulate(),
			}

			return Object.getPrototypeOf(this).find.call(this, ctx)
		},
	}),
)
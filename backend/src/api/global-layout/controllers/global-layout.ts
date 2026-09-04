/**
 * global-layout controller
 *
 * `GET /api/global-layout/website` liefert das Layout für das Frontend.
 * Populate ist fest im Backend definiert; Query-Parameter werden ignoriert.
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { buildGlobalLayoutPopulate } from '../services/global-layout-populate'

const GLOBAL_LAYOUT_UID = 'api::global-layout.global-layout' as const

export default factories.createCoreController(
	GLOBAL_LAYOUT_UID,
	({ strapi }: { strapi: Core.Strapi }) => ({
		async website(ctx) {
			const entity = await strapi.documents(GLOBAL_LAYOUT_UID).findFirst({
				...buildGlobalLayoutPopulate(),
				status: 'published',
			})

			if (!entity) {
				return ctx.notFound('GlobalLayout nicht gefunden.')
			}

			return {
				data: entity,
				meta: {},
			}
		},
	}),
)

/**
 * global-layout controller
 */

import { factories } from '@strapi/strapi'
import { PAGE_RELATION_POPULATE } from '../../../utils/page-sections-populate'

const GLOBAL_LAYOUT_POPULATE = {
	Logo: true,
	Footer: true,
	SOS: true,
	PartnerLink: {
		populate: {
			Logo: true,
		},
	},
	Impressum: {
		fields: ['documentId', 'slug', 'title'],
	},
	PrivacyPolicy: true,
	page: PAGE_RELATION_POPULATE,
	authenticated_page: PAGE_RELATION_POPULATE,
}

export default factories.createCoreController(
	'api::global-layout.global-layout',
	() => ({
		async find(ctx) {
			ctx.query = {
				...ctx.query,
				populate: GLOBAL_LAYOUT_POPULATE,
			}

			return Object.getPrototypeOf(this).find.call(this, ctx)
		},
	}),
)

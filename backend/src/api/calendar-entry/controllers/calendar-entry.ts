/**
 * calendar-entry controller
 *
 * CalendarDocument erreicht das Frontend nur innerhalb des Sichtbarkeitsfensters.
 */

import { factories } from '@strapi/strapi'
import { filterCalendarDocumentsInPayload } from '../utils/calendar-document-visibility'

export default factories.createCoreController(
	'api::calendar-entry.calendar-entry',
	() => ({
		async find(ctx) {
			const result = await super.find(ctx)
			return filterCalendarDocumentsInPayload(result)
		},

		async findOne(ctx) {
			const result = await super.findOne(ctx)
			return filterCalendarDocumentsInPayload(result)
		},
	}),
)

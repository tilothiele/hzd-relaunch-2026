/**
 * global-layout populate
 *
 * Liefert das feste Populate für `GET /api/global-layout/website`.
 *
 * Hintergrund: Strapi v5 lehnt die Kombination `populate: { '*': true, ... }`
 * mit expliziten Sub-Populates ab (ValidationError "Invalid key *"). Statt
 * der Wildcard listen wir alle Top-Level-Attribute explizit auf — semantisch
 * identisch zu `populate=*` für das aktuelle Schema, ohne Validation-Fehler.
 *
 * Dynamic Zones (`page.Sections`, `authenticated_page.Sections`) und
 * `Restriction.user_groups` kommen aus `buildPageRelationPopulate()`.
 */

import { buildPageRelationPopulate } from '../../../utils/page-sections-populate'

export function buildGlobalLayoutPopulate(): Record<string, unknown> {
	return {
		populate: {
			Logo: true,
			Footer: true,
			SOS: true,
			PartnerLink: true,
			Impressum: true,
			PrivacyPolicy: true,
			CalendarHeader: {
				populate: {
					HeroImage: true,
					HeroImageMouseOver: true,
					HeroCta: true,
				},
			},
			ResultsHeader: {
				populate: {
					HeroImage: true,
					HeroImageMouseOver: true,
					HeroCta: true,
				},
			},
			page: buildPageRelationPopulate(),
			authenticated_page: buildPageRelationPopulate(),
		},
	}
}
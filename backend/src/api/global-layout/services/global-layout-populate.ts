/**
 * global-layout populate
 *
 * Liefert das implizite `populate=*` für den global-layout Endpoint.
 *
 * Hintergrund: Strapi v5 lehnt die Kombination `populate: { '*': true, ... }`
 * mit expliziten Sub-Populates ab (ValidationError "Invalid key *"). Statt
 * der Wildcard listen wir alle Top-Level-Attribute explizit auf — semantisch
 * identisch zu `populate=*` für das aktuelle Schema, ohne Validation-Fehler.
 *
 * Dynamic Zones (`page.Sections`, `authenticated_page.Sections`) benötigen
 * die `on`-Syntax, um je Block-Typ die korrekten Felder zu laden. Diese
 * werden via `buildPageSectionsPopulate()` zusammengebaut.
 */

import { buildPageSectionsPopulate } from '../../../utils/page-sections-populate'

export function buildGlobalLayoutPopulate(): Record<string, unknown> {
	return {
		populate: {
			Logo: true,
			Footer: true,
			SOS: true,
			PartnerLink: true,
			Impressum: true,
			PrivacyPolicy: true,
			page: {
				populate: {
					Sections: buildPageSectionsPopulate(),
				},
			},
			authenticated_page: {
				populate: {
					Sections: buildPageSectionsPopulate(),
				},
			},
		},
	}
}
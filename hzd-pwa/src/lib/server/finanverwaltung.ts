import { getStrapiBaseUrl } from '@/lib/strapi-api'
import { resolveRegionId } from '@/constants/regional-groups'

/**
 * Kontakt der zuständigen Finanzverwaltung (Strapi > HZD Settings > Contact).
 */
export interface FinanverwaltungContact {
	headline: string | null
	name: string | null
	street: string | null
	zipCity: string | null
	phone: string | null
	emails: string[]
}

/**
 * Lädt den Finanzverwaltung-Kontakt der gegebenen Regionalgruppe aus Strapi.
 * Gibt `null` zurück, wenn keine Regionalgruppe oder kein Kontakt hinterlegt ist.
 */
export async function getFinanverwaltungContact(
	region: string | null | undefined,
): Promise<FinanverwaltungContact | null> {
	const regionId = resolveRegionId(region)
	if (!regionId) {
		return null
	}

	const url = `${getStrapiBaseUrl()}/api/hzd-setting`

	const response = await fetch(url, {
		headers: { Accept: 'application/json' },
		cache: 'no-store',
	})

	if (!response.ok) {
		throw new Error(
			`HZD Settings konnten nicht geladen werden (${response.status}).`,
		)
	}

	const payload = (await response.json()) as {
		data?: {
			[attribute: string]:
				| null
				| {
						Headline?: string | null
						Name?: string | null
						Street?: string | null
						ZipCity?: string | null
						Phone?: string | null
						Email1?: string | null
						Email2?: string | null
				  }
		}
	}

	const contact = payload?.data?.[`Finanzverwaltung_${regionId}`]
	if (!contact) {
		return null
	}

	return {
		headline: contact.Headline?.trim() ? contact.Headline : null,
		name: contact.Name?.trim() ? contact.Name : null,
		street: contact.Street?.trim() ? contact.Street : null,
		zipCity: contact.ZipCity?.trim() ? contact.ZipCity : null,
		phone: contact.Phone?.trim() ? contact.Phone : null,
		emails: [contact.Email1, contact.Email2].filter(
			(email): email is string => Boolean(email && email.trim()),
		),
	}
}

/** Adresszeilen der Postanschrift (ohne E-Mails) für die gewählte Regionalgruppe. */
export function finanContactAddressLines(
	contact: FinanverwaltungContact | null,
): string[] {
	if (!contact) return []
	return [contact.headline, contact.name, contact.street, contact.zipCity].filter(
		(line): line is string => Boolean(line && line.trim()),
	)
}

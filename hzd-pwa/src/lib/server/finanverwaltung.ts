import { getStrapiBaseUrl } from '@/lib/strapi-api'
import { REGIONAL_GROUPS, resolveRegionId } from '@/constants/regional-groups'

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

/** Normalisierte HZD Settings (Strapi Single Collection 'HZD Settings') */
export interface HdzSettings {
	/** Gläubiger-Identifikationsnummer (Attribut Glaeubiger_Identifikationsnummer) */
	glaeubigerId: string | null
	/** Finanzverwaltung-Kontakte, indexiert nach Regionalgruppen-ID (Nord/West/Mitte/Sued/Ost/HZD) */
	finanverwaltung: Record<string, FinanverwaltungContact | null>
}

type HdzSettingApiContact = {
	Headline?: string | null
	Name?: string | null
	Street?: string | null
	ZipCity?: string | null
	Phone?: string | null
	Email1?: string | null
	Email2?: string | null
}

function asText(value: string | null | undefined): string | null {
	return typeof value === 'string' && value.trim() ? value.trim() : null
}

/** Runtime-Guard: Raw-Wert der Strapi-Settings → Kontakt-Objekt oder null. */
function asContact(value: unknown): HdzSettingApiContact | null {
	if (!value || typeof value !== 'object') {
		return null
	}
	return value as HdzSettingApiContact
}

/** Runtime-Guard: Raw-Wert der Strapi-Settings → Text oder null. */
function asString(value: unknown): string | null {
	return asText(
		typeof value === 'string' ? value : null,
	)
}

function normalizeContact(
	contact: HdzSettingApiContact | null | undefined,
): FinanverwaltungContact | null {
	if (!contact) {
		return null
	}
	return {
		headline: asText(contact.Headline),
		name: asText(contact.Name),
		street: asText(contact.Street),
		zipCity: asText(contact.ZipCity),
		phone: asText(contact.Phone),
		emails: [contact.Email1, contact.Email2].filter(
			(email): email is string => Boolean(email && email.trim()),
		),
	}
}

/** Lädt die HZD Settings aus Strapi (einmalig je Aufruf, ohne Caching). */
async function fetchHdzSettings(): Promise<Record<string, unknown>> {
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
		data?: Record<string, unknown>
	}
	return payload?.data ?? {}
}

/**
 * Lädt die HZD Settings (Gläubiger-Identifikationsnummer +
 * Finanzverwaltung-Kontakte) aus dem Strapi-Backend.
 */
export async function getHdzSettings(): Promise<HdzSettings> {
	const data = await fetchHdzSettings()
	return {
		glaeubigerId: asString(data.Glaeubiger_Identifikationsnummer),
		finanverwaltung: Object.fromEntries(
			REGIONAL_GROUPS.map((group) => [
				group.id,
				normalizeContact(asContact(data[`Finanzverwaltung_${group.id}`])),
			]),
		),
	}
}

/**
 * Gläubiger-Identifikationsnummer aus Strapi > HZD Settings.
 * Gibt `null` zurück, wenn keine Nummer hinterlegt ist.
 */
export async function getGlaeubigerId(): Promise<string | null> {
	const settings = await getHdzSettings()
	return settings.glaeubigerId
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
	const settings = await getHdzSettings()
	return settings.finanverwaltung[regionId] ?? null
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

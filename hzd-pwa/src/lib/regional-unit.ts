/**
 * Briefkopf des Mitgliedsantrags aus einer RegionalUnit.
 * Straße und Ort stammen von den verknüpften Ortsgruppen,
 * Telefon und E-Mail von CFO, CEO und Schriftführung.
 */

export interface RegionalUnitPerson {
	phone: string | null
	email: string | null
}

export interface RegionalUnitCommunity {
	name: string | null
	street: string | null
	zipCode: string | null
	city: string | null
}

export interface RegionalUnit {
	documentId: string
	name: string
	communities: RegionalUnitCommunity[]
	ceo: RegionalUnitPerson | null
	cfo: RegionalUnitPerson | null
	secretary: RegionalUnitPerson | null
}

/** Werte für die obersten Platzhalter der DOCX-Vorlage. */
export interface RegionalUnitHeader {
	headline: string
	name: string
	street: string
	zipCity: string
	phone: string
	email1: string
	email2: string
	antragFuer: string
}

function clean(value: string | null | undefined): string {
	return value?.trim() ?? ''
}

function joinLines(values: string[]): string {
	return values.filter((value) => value !== '').join('\n')
}

export function buildRegionalUnitHeader(unit: RegionalUnit): RegionalUnitHeader {
	const names = unit.communities.map((community) => clean(community.name))
	const streets = unit.communities.map((community) => clean(community.street))
	const zipCities = unit.communities.map((community) =>
		[clean(community.zipCode), clean(community.city)]
			.filter((part) => part !== '')
			.join(' '),
	)
	const phone = [unit.cfo, unit.ceo, unit.secretary]
		.map((person) => clean(person?.phone))
		.find((value) => value !== '') ?? ''
	const email1 = clean(unit.cfo?.email)
	const email2Candidate = clean(unit.secretary?.email) || clean(unit.ceo?.email)
	const email2 = email2Candidate !== '' && email2Candidate !== email1
		? email2Candidate
		: ''
	const communityNames = names.filter((name) => name !== '')

	return {
		headline: clean(unit.name),
		name: joinLines(communityNames),
		street: joinLines(streets),
		zipCity: joinLines(zipCities),
		phone,
		email1,
		email2,
		antragFuer: communityNames.join(', ') || clean(unit.name),
	}
}

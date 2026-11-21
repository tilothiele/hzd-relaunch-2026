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
	documentId: string
	name: string | null
	street: string | null
	zipCode: string | null
	city: string | null
	ceo: RegionalUnitPerson | null
	cfo: RegionalUnitPerson | null
	secretary: RegionalUnitPerson | null
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

function firstPhone(
	...people: Array<RegionalUnitPerson | null | undefined>
): string {
	return people
		.map((person) => clean(person?.phone))
		.find((value) => value !== '') ?? ''
}

function firstEmail(
	...people: Array<RegionalUnitPerson | null | undefined>
): string {
	return people
		.map((person) => clean(person?.email))
		.find((value) => value !== '') ?? ''
}

function zipCity(community: RegionalUnitCommunity): string {
	return [clean(community.zipCode), clean(community.city)]
		.filter((part) => part !== '')
		.join(' ')
}

export function buildRegionalUnitHeader(unit: RegionalUnit): RegionalUnitHeader {
	const names = unit.communities.map((community) => clean(community.name))
	const communityNames = names.filter((name) => name !== '')
	const email1 = firstEmail(unit.cfo)
	const email2 = firstEmail(unit.secretary, unit.ceo)
	return {
		headline: clean(unit.name),
		name: joinLines(communityNames),
		street: joinLines(
			unit.communities.map((community) => clean(community.street)),
		),
		zipCity: joinLines(unit.communities.map(zipCity)),
		phone: firstPhone(unit.cfo, unit.ceo, unit.secretary),
		email1,
		email2: email2 !== '' && email2 !== email1 ? email2 : '',
		antragFuer: communityNames.join(', ') || clean(unit.name),
	}
}

/** Briefkopf für genau eine gewählte Ortsgruppe. */
export function buildLocalCommunityHeader(
	unit: RegionalUnit,
	community: RegionalUnitCommunity,
): RegionalUnitHeader {
	const email1 = firstEmail(community.cfo, unit.cfo)
	const email2 = firstEmail(
		community.secretary,
		community.ceo,
		unit.secretary,
		unit.ceo,
	)
	const name = clean(community.name)
	return {
		headline: clean(unit.name),
		name,
		street: clean(community.street),
		zipCity: zipCity(community),
		phone: firstPhone(
			community.cfo,
			community.ceo,
			community.secretary,
			unit.cfo,
			unit.ceo,
			unit.secretary,
		),
		email1,
		email2: email2 !== '' && email2 !== email1 ? email2 : '',
		antragFuer: name || clean(unit.name),
	}
}

/**
 * JSON in der Single-Collection HZD Settings, Attribut `CS_Importer_config`.
 *
 * Gilt nur für Updates. Neue User, Dogs und Breeder werden vollständig
 * gefüllt. `cId`, `password` und `BreederRole` sind Identitätsfelder und
 * nicht Teil der Konfiguration.
 *
 * `keep`: vorhandener Wert bleibt.
 * `fillIfEmpty`: schreiben nur, wenn das Zielfeld leer oder null ist.
 * `overwrite`: Importwert ersetzt den vorhandenen Wert.
 *
 * Leere Quellwerte leeren ein Feld nur, wenn der Import den Wert
 * ausdrücklich setzt (zum Beispiel `cEmail`). Felder ohne neuen Wert
 * bleiben sonst unangetastet.
 *
 * Fehlende Schlüssel werden beim Lesen mit `defaultMode` ergänzt.
 * Die Standards entsprechen dem bisherigen Import.
 *
 * `breeder.zuechter` (Rolle B) schreibt „Verarbeite CS_Member“.
 * `breeder.deckruedenbesitzer` (Rolle S) schreibt „Aktualisiere Deckrüden“.
 * Hat ein Breeder schon Rolle S, schreibt „Verarbeite CS_Member“ nur
 * `cPhone` und `cBreederEmail` mit der Deckrüdenbesitzer-Konfiguration.
 * „Aktualisiere Züchter“ ändert keine Collection-Felder, sondern nur
 * Benutzergruppen.
 */
export type CsFieldOverwriteMode = 'keep' | 'fillIfEmpty' | 'overwrite'

export const CS_FIELD_OVERWRITE_MODES = [
	'keep',
	'fillIfEmpty',
	'overwrite',
] as const

export const CS_OVERWRITE_MODE_LABEL: Record<CsFieldOverwriteMode, string> = {
	keep: 'nicht überschreiben',
	fillIfEmpty: 'überschreiben, wenn nicht leer',
	overwrite: 'überschreiben',
}

export interface CsImportField<K extends string = string> {
	key: K
	label: string
	labelEn: string
	step: string
	defaultMode: CsFieldOverwriteMode
	/** Quellfeld in CS_Member oder CS_Dog, sofern das Attribut daraus befüllt wird. */
	source?: string
	sourceEn?: string
	hint?: string
	hintEn?: string
}

export type CsFieldModes<K extends string> = Record<K, CsFieldOverwriteMode>

const STEP_MEMBER = 'Verarbeite CS_Member'
const STEP_DOG = 'Verarbeite CS_Dog'
const STEP_STUD = 'Aktualisiere Deckrüden'
const STEP_MEMBER_AND_STUD =
	'Verarbeite CS_Member, Aktualisiere Deckrüden'

function field<K extends string>(
	key: K,
	label: string,
	labelEn: string,
	step: string,
	defaultMode: CsFieldOverwriteMode,
	source?: string,
	sourceEn?: string,
	hint?: string,
	hintEn?: string,
): CsImportField<K> {
	return {
		key,
		label,
		labelEn,
		step,
		defaultMode,
		source,
		sourceEn,
		hint,
		hintEn,
	}
}

const DOG_BREED_SURVEY_SOURCE = [
	'VerhaltenIi',
	'VerhaltenIii',
	'VerhaltenIiiE',
	'VerhaltenIiiF',
	'VerhaltenIiiZurueckgestellt',
	'VerhaltenIiiNichtBestanden',
	'VerhaltenIiiAbbruch',
	'VerhaltenIv',
	'VerhaltenVeteranen',
	'KoerungHzd',
	'KoerungHzdE',
	'KoerungHzdNichtBestanden',
].map((name) => `CS_Dog.${name}`).join(', ')

const MEMBER_ADDRESS_SOURCE = [
	'Firstname',
	'Lastname',
	'Street',
	'Zipcode',
	'City',
	'Country',
].map((name) => `CS_Member.${name}`).join(', ')

export const USER_IMPORT_FIELDS = [
	field(
		'username',
		'Benutzername',
		'Username',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.MembershipNumber, sonst CS_Member.IdPerson',
		'CS_Member.MembershipNumber, otherwise CS_Member.IdPerson',
	),
	field(
		'email',
		'E-Mail (Login)',
		'Email (login)',
		STEP_MEMBER,
		'fillIfEmpty',
		'CS_Member.Email',
		undefined,
		'Ein Platzhalter c.<Id>@hovawarte.com gilt als leer.',
		'A placeholder c.<id>@hovawarte.com counts as empty.',
	),
	field('provider', 'Provider', 'Provider', STEP_MEMBER, 'overwrite'),
	field('confirmed', 'Bestätigt', 'Confirmed', STEP_MEMBER, 'overwrite'),
	field(
		'blocked',
		'Gesperrt',
		'Blocked',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.PersonIsABreeder, CS_Member.DateOfJoining, CS_Member.DateOfLeaving',
	),
	field('role', 'Rolle', 'Role', STEP_MEMBER, 'overwrite'),
	field(
		'publishMyData',
		'Daten veröffentlichen',
		'Publish my data',
		STEP_MEMBER_AND_STUD,
		'overwrite',
		'CS_Member.PersonIsABreeder',
	),
	field(
		'deckrueden_info',
		'Deckrüden-Profil',
		'Stud dog profile',
		STEP_STUD,
		'overwrite',
	),
	field('title', 'Titel', 'Title', STEP_MEMBER, 'overwrite', 'CS_Member.Title'),
	field(
		'firstName',
		'Vorname',
		'First name',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Firstname',
	),
	field(
		'lastName',
		'Nachname',
		'Last name',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Lastname',
	),
	field(
		'address1',
		'Straße',
		'Street',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Street',
	),
	field('zip', 'PLZ', 'Postal code', STEP_MEMBER, 'overwrite', 'CS_Member.Zipcode'),
	field('city', 'Ort', 'City', STEP_MEMBER, 'overwrite', 'CS_Member.City'),
	field(
		'countryCode',
		'Land',
		'Country',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Country',
	),
	field(
		'phone',
		'Telefon',
		'Phone',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Mobile, sonst CS_Member.Phone',
		'CS_Member.Mobile, otherwise CS_Member.Phone',
	),
	field(
		'sex',
		'Anrede',
		'Salutation',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Salutation',
	),
	field('cEmail', 'cEmail', 'cEmail', STEP_MEMBER, 'overwrite', 'CS_Member.Email'),
	field(
		'cFlagAccess',
		'cFlagAccess',
		'cFlagAccess',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.C01Access',
	),
	field(
		'memberSince',
		'Mitglied seit',
		'Member since',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.DateOfJoining',
	),
	field(
		'cancellationOn',
		'Austritt am',
		'Cancellation on',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.DateOfLeaving',
	),
	field(
		'membershipNumber',
		'Mitgliedsnummer',
		'Membership number',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.MembershipNumber',
	),
	field('region', 'Region', 'Region', STEP_MEMBER, 'overwrite', 'CS_Member.Oblast'),
	field(
		'dateOfBirth',
		'Geburtsdatum',
		'Date of birth',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.DateOfBirth',
	),
	field(
		'dateOfDeath',
		'Sterbedatum',
		'Date of death',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.DateOfDeath',
	),
]

export const DOG_IMPORT_FIELDS = [
	field(
		'givenName',
		'Rufname',
		'Given name',
		STEP_DOG,
		'overwrite',
		'CS_Dog.GivenName',
	),
	field(
		'fullKennelName',
		'Voller Zuchtname',
		'Full kennel name',
		STEP_DOG,
		'overwrite',
		'CS_Dog.FullName',
	),
	field(
		'cBreederId',
		'cBreederId',
		'cBreederId',
		STEP_DOG,
		'overwrite',
		'CS_Dog.IdBreeder',
	),
	field(
		'cOwnerId',
		'cOwnerId',
		'cOwnerId',
		STEP_DOG,
		'overwrite',
		'CS_Dog.IdOwner',
	),
	field(
		'microchipNo',
		'Chipnummer',
		'Microchip number',
		STEP_DOG,
		'overwrite',
		'CS_Dog.ChipNumber',
	),
	field('sex', 'Geschlecht', 'Sex', STEP_DOG, 'overwrite', 'CS_Dog.Sex'),
	field(
		'dateOfBirth',
		'Geburtsdatum',
		'Date of birth',
		STEP_DOG,
		'overwrite',
		'CS_Dog.DateOfBirth',
	),
	field(
		'dateOfDeath',
		'Sterbedatum',
		'Date of death',
		STEP_DOG,
		'overwrite',
		'CS_Dog.DateOfDeath',
	),
	field(
		'cFertile',
		'Fruchtbar',
		'Fertile',
		STEP_DOG,
		'overwrite',
		'CS_Dog.Fertile',
	),
	field(
		'HD',
		'HD',
		'HD',
		STEP_DOG,
		'overwrite',
		'CS_Dog.HdG, sonst CS_Dog.Hd',
		'CS_Dog.HdG, otherwise CS_Dog.Hd',
	),
	field(
		'SOD1',
		'SOD1',
		'SOD1',
		STEP_DOG,
		'overwrite',
		'CS_Dog.GentestSod1',
	),
	field(
		'HeartCheck',
		'Herzuntersuchung',
		'Heart check',
		STEP_DOG,
		'overwrite',
		'CS_Dog.Herzuntersuchung',
	),
	field(
		'EyesCheck',
		'Augenuntersuchung',
		'Eye check',
		STEP_DOG,
		'overwrite',
		'CS_Dog.Augenuntersuchung',
	),
	field(
		'Genprofil',
		'DNA-Profil',
		'DNA profile',
		STEP_DOG,
		'overwrite',
		'CS_Dog.DnaProfil',
	),
	field('color', 'Farbe', 'Color', STEP_DOG, 'overwrite', 'CS_Dog.Color'),
	field(
		'cStudBookNumber',
		'Zuchtbuchnummer',
		'Stud book number',
		STEP_DOG,
		'overwrite',
		'CS_Dog.StudbookNumber',
	),
	field(
		'cStudBookNumberFather',
		'Zuchtbuchnummer Vater',
		'Sire stud book number',
		STEP_DOG,
		'overwrite',
		'CS_Dog.StudbookNumberSire',
	),
	field(
		'cStudBookNumberMother',
		'Zuchtbuchnummer Mutter',
		'Dam stud book number',
		STEP_DOG,
		'overwrite',
		'CS_Dog.StudbookNumberDam',
	),
	field(
		'Exhibitions',
		'Ausstellungen',
		'Exhibitions',
		STEP_DOG,
		'overwrite',
		'CS_Dog.Richterbericht',
	),
	field(
		'BreedSurvey',
		'Zuchttauglichkeit',
		'Breed survey',
		STEP_DOG,
		'overwrite',
		DOG_BREED_SURVEY_SOURCE,
	),
]

export const BREEDER_ZUECHTER_FIELDS = [
	field(
		'kennelName',
		'Zwingername',
		'Kennel name',
		STEP_MEMBER,
		'keep',
		'CS_Member.BreedingStation',
	),
	field(
		'IsActive',
		'Aktiv',
		'Active',
		STEP_MEMBER,
		'keep',
		'CS_Member.PersonIsAnActiveBreeder',
	),
	field(
		'BreederEmail',
		'BreederEmail (öffentlich)',
		'BreederEmail (public)',
		STEP_MEMBER,
		'keep',
		'CS_Member.Email',
	),
	field(
		'cBreederEmail',
		'cBreederEmail',
		'cBreederEmail',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Email',
	),
	field(
		'Phone',
		'Telefon',
		'Phone',
		STEP_MEMBER,
		'keep',
		'CS_Member.Phone',
	),
	field(
		'cPhone',
		'cPhone',
		'cPhone',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Phone',
	),
	field(
		'Address',
		'Adresse',
		'Address',
		STEP_MEMBER,
		'keep',
		MEMBER_ADDRESS_SOURCE,
	),
]

export const BREEDER_STUD_OWNER_FIELDS = [
	field(
		'kennelName',
		'Zwingername',
		'Kennel name',
		STEP_STUD,
		'keep',
		'CS_Member.Firstname, CS_Member.Lastname (Präfix DRB)',
		'CS_Member.Firstname, CS_Member.Lastname (prefix DRB)',
	),
	field(
		'member',
		'Besitzer',
		'Owner',
		STEP_STUD,
		'overwrite',
		'CS_Dog.IdOwner',
	),
	field(
		'BreederEmail',
		'BreederEmail (öffentlich)',
		'BreederEmail (public)',
		STEP_STUD,
		'keep',
		'CS_Member.Email',
	),
	field(
		'cBreederEmail',
		'cBreederEmail',
		'cBreederEmail',
		STEP_STUD,
		'overwrite',
		'CS_Member.Email',
	),
	field(
		'Phone',
		'Telefon',
		'Phone',
		STEP_STUD,
		'overwrite',
		'CS_Member.Phone',
	),
	field(
		'cPhone',
		'cPhone',
		'cPhone',
		STEP_MEMBER,
		'overwrite',
		'CS_Member.Phone',
	),
	field(
		'Address',
		'Adresse',
		'Address',
		STEP_STUD,
		'overwrite',
		MEMBER_ADDRESS_SOURCE,
	),
]

export type UserImportField = (typeof USER_IMPORT_FIELDS)[number]['key']
export type DogImportField = (typeof DOG_IMPORT_FIELDS)[number]['key']
export type BreederZuechterField =
	(typeof BREEDER_ZUECHTER_FIELDS)[number]['key']
export type BreederStudOwnerField =
	(typeof BREEDER_STUD_OWNER_FIELDS)[number]['key']

export interface CsImporterConfig {
	user: CsFieldModes<UserImportField>
	dog: CsFieldModes<DogImportField>
	breeder: {
		zuechter: CsFieldModes<BreederZuechterField>
		deckruedenbesitzer: CsFieldModes<BreederStudOwnerField>
	}
}

export function importFieldKeys<K extends string>(
	fields: readonly CsImportField<K>[],
): K[] {
	return fields.map((entry) => entry.key)
}

export function isCsFieldOverwriteMode(
	value: unknown,
): value is CsFieldOverwriteMode {
	return value === 'keep'
		|| value === 'fillIfEmpty'
		|| value === 'overwrite'
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value)
}

function readFieldModes<K extends string>(
	value: unknown,
	fields: readonly CsImportField<K>[],
): CsFieldModes<K> {
	const source = isRecord(value) ? value : {}
	const modes = {} as CsFieldModes<K>
	for (const entry of fields) {
		const mode = source[entry.key]
		modes[entry.key] = isCsFieldOverwriteMode(mode)
			? mode
			: entry.defaultMode
	}
	return modes
}

export function defaultCsImporterConfig(): CsImporterConfig {
	return normalizeCsImporterConfig(undefined)
}

export function normalizeCsImporterConfig(value: unknown): CsImporterConfig {
	const source = isRecord(value) ? value : {}
	const breeder = isRecord(source.breeder) ? source.breeder : {}
	return {
		user: readFieldModes(source.user, USER_IMPORT_FIELDS),
		dog: readFieldModes(source.dog, DOG_IMPORT_FIELDS),
		breeder: {
			zuechter: readFieldModes(breeder.zuechter, BREEDER_ZUECHTER_FIELDS),
			deckruedenbesitzer: readFieldModes(
				breeder.deckruedenbesitzer,
				BREEDER_STUD_OWNER_FIELDS,
			),
		},
	}
}

export function isStoredFieldEmpty(field: string, value: unknown): boolean {
	if (value === null || value === undefined) {
		return true
	}
	if (typeof value === 'string') {
		return value.trim().length === 0
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return false
	}
	if (Array.isArray(value)) {
		return value.length === 0
	}
	if (typeof value === 'object') {
		if (field === 'Address') {
			return false
		}
		const record = value as { id?: unknown; count?: unknown }
		if (typeof record.count === 'number') {
			return record.count === 0
		}
		if ('id' in record) {
			return record.id == null
		}
	}
	return false
}

/**
 * Entfernt Felder aus dem Update-Payload gemäß der Modi.
 * Schlüssel, die der Import nicht gesetzt hat, bleiben unverändert.
 */
export function applyFieldOverwrite<K extends string>(
	data: Record<string, unknown>,
	stored: Record<string, unknown>,
	fields: readonly K[],
	modes: Partial<Record<K, CsFieldOverwriteMode>>,
	isEmpty: (
		field: string,
		value: unknown,
	) => boolean = isStoredFieldEmpty,
): void {
	for (const fieldName of fields) {
		if (!Object.prototype.hasOwnProperty.call(data, fieldName)) {
			continue
		}
		const mode = modes[fieldName] ?? 'overwrite'
		if (mode === 'overwrite') {
			continue
		}
		if (mode === 'keep') {
			delete data[fieldName]
			continue
		}
		if (!isEmpty(fieldName, stored[fieldName])) {
			delete data[fieldName]
		}
	}
}

function appendGroupLog(
	lines: string[],
	group: string,
	fields: readonly CsImportField[],
	modes: Partial<Record<string, CsFieldOverwriteMode>>,
) {
	for (const entry of fields) {
		const mode = modes[entry.key] ?? entry.defaultMode
		lines.push(
			`  ${group}.${entry.key}=${CS_OVERWRITE_MODE_LABEL[mode]} | ${entry.label} | ${entry.step}`,
		)
	}
}

export function formatCsImporterConfigLog(
	config: CsImporterConfig,
): string[] {
	const lines = [
		`CS_Importer_config JSON: ${JSON.stringify(config)}`,
	]
	appendGroupLog(lines, 'user', USER_IMPORT_FIELDS, config.user)
	appendGroupLog(lines, 'dog', DOG_IMPORT_FIELDS, config.dog)
	appendGroupLog(
		lines,
		'breeder.zuechter',
		BREEDER_ZUECHTER_FIELDS,
		config.breeder.zuechter,
	)
	appendGroupLog(
		lines,
		'breeder.deckruedenbesitzer',
		BREEDER_STUD_OWNER_FIELDS,
		config.breeder.deckruedenbesitzer,
	)
	return lines
}

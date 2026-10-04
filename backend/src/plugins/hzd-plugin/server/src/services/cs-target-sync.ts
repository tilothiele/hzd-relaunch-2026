import type { Core } from '@strapi/strapi'

const USER_UID = 'plugin::users-permissions.user'
const DOG_UID = 'plugin::hzd-plugin.dog'

const REGION_MAP: Record<string, string> = {
	nord: 'Nord',
	ost: 'Ost',
	mitte: 'Mitte',
	west: 'West',
	süd: 'Süd',
	sued: 'Süd',
	sud: 'Süd',
}

const COUNTRY_CODE_MAP: Record<string, string> = {
	deutschland: 'DE',
	germany: 'DE',
	österreich: 'AT',
	oesterreich: 'AT',
	austria: 'AT',
	schweiz: 'CH',
	switzerland: 'CH',
}

const USER_SEX_MAP: Record<string, 'M' | 'F'> = {
	herr: 'M',
	mr: 'M',
	'mr.': 'M',
	m: 'M',
	frau: 'F',
	mrs: 'F',
	'mrs.': 'F',
	ms: 'F',
	'ms.': 'F',
	f: 'F',
}

const DOG_SEX_MAP: Record<string, 'M' | 'F'> = {
	hündin: 'F',
	weiblich: 'F',
	f: 'F',
	female: 'F',
	'1': 'F',
	rüde: 'M',
	männlich: 'M',
	m: 'M',
	male: 'M',
	'0': 'M',
}

const DOG_COLOR_MAP: Record<string, 'S' | 'SM' | 'B'> = {
	schwarz: 'S',
	schwarzmarken: 'SM',
	blond: 'B',
}

const DOG_SOD1_MAP: Record<string, 'N_N' | 'N_DM' | 'DM_DM'> = {
	'n/n': 'N_N',
	'n/dm': 'N_DM',
	'dm/dm': 'DM_DM',
}

const DOG_HD_VALUES = new Set(['A1', 'A2', 'B1', 'B2'])

const BREED_SURVEY_FIELDS = [
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
]

type TargetData = Record<string, unknown>

function cell(value: unknown): string | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value)
	}
	if (typeof value !== 'string') {
		return null
	}
	const trimmed = value.trim()
	if (!trimmed || trimmed === '-') {
		return null
	}
	return trimmed
}

function truncate(value: string, maxLength: number): string {
	return value.length <= maxLength ? value : value.slice(0, maxLength)
}

function parseInteger(value: unknown): number | null {
	const cleaned = cell(value)
	if (!cleaned) {
		return null
	}
	const digits = cleaned.replace(/[^\d-]/g, '')
	if (!digits || digits === '-') {
		return null
	}
	const parsed = Number.parseInt(digits, 10)
	return Number.isNaN(parsed) ? null : parsed
}

function parseBoolean(value: unknown): boolean | null {
	const cleaned = cell(value)
	if (!cleaned) {
		return null
	}
	const normalized = cleaned.toLowerCase()
	if (normalized === '1' || normalized === 'true') {
		return true
	}
	if (normalized === '0' || normalized === 'false') {
		return false
	}
	return null
}

function parseDate(value: unknown): string | null {
	const cleaned = cell(value)
	if (!cleaned) {
		return null
	}
	if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
		return cleaned
	}
	const match = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(cleaned)
	if (!match) {
		return null
	}
	const day = match[1].padStart(2, '0')
	const month = match[2].padStart(2, '0')
	return `${match[3]}-${month}-${day}`
}

function parseEmail(value: unknown): string | null {
	const cleaned = cell(value)
	if (!cleaned) {
		return null
	}
	const email = cleaned.toLowerCase()
	if (!email.includes('@') || email.includes(' ') || email.endsWith('.')) {
		return null
	}
	return truncate(email, 255)
}

function parseRegion(value: unknown): string | null {
	const cleaned = cell(value)
	if (!cleaned) {
		return null
	}
	return REGION_MAP[cleaned.toLowerCase()] ?? null
}

function parseCountryCode(value: unknown): string | null {
	const cleaned = cell(value)
	if (!cleaned) {
		return null
	}
	const mapped = COUNTRY_CODE_MAP[cleaned.toLowerCase()]
	if (mapped) {
		return mapped
	}
	return cleaned.length >= 2 ? cleaned.slice(0, 2).toUpperCase() : null
}

function lookup<T extends string>(
	value: unknown,
	map: Record<string, T>,
): T | null {
	const cleaned = cell(value)
	if (!cleaned) {
		return null
	}
	return map[cleaned.toLowerCase()] ?? null
}

function parseHd(dog: Record<string, unknown>): string | null {
	const raw = cell(dog.HdG) ?? cell(dog.Hd)
	if (!raw) {
		return null
	}
	const normalized = raw.replace('(G)', '').trim().toUpperCase()
	return DOG_HD_VALUES.has(normalized) ? normalized : null
}

function parsePresentFlag(value: unknown): boolean | null {
	return cell(value) ? true : null
}

function assign(data: TargetData, key: string, value: unknown) {
	if (value === null || value === undefined) {
		return
	}
	data[key] = value
}

function mapMemberToUser(
	member: Record<string, unknown>,
	cId: number,
	authenticatedRoleId: number,
): TargetData {
	const isBreeder = parseBoolean(member.PersonIsABreeder) === true
	const membershipNumber = parseInteger(member.MembershipNumber)
	const phone = cell(member.Mobile) ?? cell(member.Phone)
	const username = isBreeder || membershipNumber === null
		? `c.${cId}`
		: String(membershipNumber)

	const data: TargetData = {
		username,
		email: `c.${cId}@hovawarte.com`,
		provider: 'local',
		confirmed: true,
		blocked: false,
		role: authenticatedRoleId,
		cId,
		publishMyData: isBreeder,
	}

	assign(data, 'cEmail', parseEmail(member.Email))
	assign(data, 'cFlagAccess', parseBoolean(member.C01Access))
	assign(data, 'title', cell(member.Title))
	assign(data, 'firstName', cell(member.Firstname))
	assign(data, 'lastName', cell(member.Lastname))
	assign(data, 'address1', truncateOrNull(cell(member.Street), 100))
	assign(data, 'zip', truncateOrNull(cell(member.Zipcode), 5))
	assign(data, 'city', cell(member.City))
	assign(data, 'countryCode', parseCountryCode(member.Country))
	assign(data, 'phone', truncateOrNull(phone, 50))
	assign(data, 'sex', lookup(member.Salutation, USER_SEX_MAP))
	assign(data, 'cFlagBreeder', parseBoolean(member.PersonIsABreeder))
	assign(data, 'membershipNumber', membershipNumber)
	assign(data, 'dateOfBirth', parseDate(member.DateOfBirth))
	assign(data, 'dateOfDeath', parseDate(member.DateOfDeath))
	assign(data, 'memberSince', parseDate(member.DateOfJoining))
	assign(data, 'cancellationOn', parseDate(member.DateOfLeaving))
	assign(data, 'region', parseRegion(member.Oblast))
	return data
}

function truncateOrNull(value: string | null, maxLength: number): string | null {
	return value ? truncate(value, maxLength) : null
}

function mapDogToTarget(dog: Record<string, unknown>, cId: number): TargetData {
	const survey = BREED_SURVEY_FIELDS
		.map((name) => cell(dog[name]))
		.filter((value): value is string => value !== null)

	const data: TargetData = { cId }
	assign(data, 'givenName', truncateOrNull(cell(dog.GivenName), 100))
	assign(data, 'fullKennelName', truncateOrNull(cell(dog.FullName), 500))
	assign(data, 'cBreederId', parseInteger(dog.IdBreeder))
	assign(data, 'cOwnerId', parseInteger(dog.IdOwner))
	assign(data, 'microchipNo', truncateOrNull(cell(dog.ChipNumber), 30))
	assign(data, 'sex', lookup(dog.Sex, DOG_SEX_MAP))
	assign(data, 'dateOfBirth', parseDate(dog.DateOfBirth))
	assign(data, 'dateOfDeath', parseDate(dog.DateOfDeath))
	assign(data, 'cFertile', parseBoolean(dog.Fertile))
	assign(data, 'HD', parseHd(dog))
	assign(data, 'SOD1', lookup(dog.GentestSod1, DOG_SOD1_MAP))
	assign(data, 'HeartCheck', parsePresentFlag(dog.Herzuntersuchung))
	assign(data, 'EyesCheck', parsePresentFlag(dog.Augenuntersuchung))
	assign(data, 'Genprofil', parsePresentFlag(dog.DnaProfil))
	assign(data, 'color', lookup(dog.Color, DOG_COLOR_MAP))
	assign(data, 'cStudBookNumber', cell(dog.StudbookNumber))
	assign(data, 'cStudBookNumberFather', cell(dog.StudbookNumberSire))
	assign(data, 'cStudBookNumberMother', cell(dog.StudbookNumberDam))
	assign(data, 'Exhibitions', cell(dog.Richterbericht))
	if (survey.length > 0) {
		data.BreedSurvey = survey.join('\n')
	}
	return data
}

async function hashPassword(strapi: Core.Strapi, password: string): Promise<string> {
	const service = strapi.plugin('users-permissions').service('user') as {
		hashPassword?: (value: string) => Promise<string>
	}
	if (typeof service.hashPassword === 'function') {
		return service.hashPassword(password)
	}
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const bcrypt = require('bcryptjs') as {
		hash: (value: string, rounds: number) => Promise<string>
	}
	return bcrypt.hash(password, 10)
}

async function findByCId(
	strapi: Core.Strapi,
	uid: string,
	cId: number,
): Promise<{ id?: number; documentId?: string } | null> {
	const found = await strapi.db.query(uid).findOne({
		where: { cId },
		select: ['id', 'documentId'],
	})
	return found ?? null
}

async function saveDocument(
	strapi: Core.Strapi,
	uid: string,
	existing: { id?: number; documentId?: string } | null,
	data: TargetData,
) {
	if (existing?.documentId) {
		await strapi.documents(uid as never).update({
			documentId: existing.documentId,
			data: data as never,
		})
		return existing.documentId
	}
	if (existing?.id) {
		await strapi.db.query(uid).update({
			where: { id: existing.id },
			data,
		})
		return String(existing.id)
	}
	const created = await strapi.documents(uid as never).create({
		data: data as never,
	}) as { documentId?: string }
	return created?.documentId ?? ''
}

export async function loadAuthenticatedRoleId(strapi: Core.Strapi): Promise<number> {
	const role = await strapi.db.query('plugin::users-permissions.role').findOne({
		where: { type: 'authenticated' },
		select: ['id'],
	})
	if (typeof role?.id !== 'number') {
		throw new Error('Rolle "authenticated" nicht gefunden')
	}
	return role.id
}

export async function updateUser(
	strapi: Core.Strapi,
	member: Record<string, unknown>,
	authenticatedRoleId: number,
	log: (line: string) => void,
) {
	const cId = parseInteger(member.IdPerson)
	if (cId === null) {
		log('CS_Member ohne IdPerson, User-Update übersprungen')
		return
	}

	const data = mapMemberToUser(member, cId, authenticatedRoleId)
	const existing = await findByCId(strapi, USER_UID, cId)
	if (!existing) {
		data.password = await hashPassword(strapi, `Import-${cId}-ChangeMe!`)
	}
	const savedId = await saveDocument(strapi, USER_UID, existing, data)
	log(
		existing
			? `User aktualisiert cId=${cId} documentId=${savedId}`
			: `User erstellt cId=${cId} documentId=${savedId}`,
	)
}

export async function updateDog(
	strapi: Core.Strapi,
	dog: Record<string, unknown>,
	log: (line: string) => void,
) {
	const cId = parseInteger(dog.IdAnimal)
	if (cId === null) {
		log('CS_Dog ohne IdAnimal, Dog-Update übersprungen')
		return
	}

	const data = mapDogToTarget(dog, cId)
	const existing = await findByCId(strapi, DOG_UID, cId)
	const savedId = await saveDocument(strapi, DOG_UID, existing, data)
	log(
		existing
			? `Dog aktualisiert cId=${cId} documentId=${savedId}`
			: `Dog erstellt cId=${cId} documentId=${savedId}`,
	)
}

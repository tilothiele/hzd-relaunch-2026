import type { Core } from '@strapi/strapi'

const USER_UID = 'plugin::users-permissions.user'
const MIN_USERNAME_LENGTH = 3
const DOG_UID = 'plugin::hzd-plugin.dog'
const BREEDER_UID = 'plugin::hzd-plugin.breeder'

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

interface CalendarDate {
	year: number
	month: number
	day: number
}

function toCalendarDate(value: unknown): CalendarDate | null {
	const iso = parseDate(value)
	if (!iso) {
		return null
	}
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
	if (!match) {
		return null
	}
	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])
	const probe = new Date(Date.UTC(year, month - 1, day))
	if (
		probe.getUTCFullYear() !== year
		|| probe.getUTCMonth() !== month - 1
		|| probe.getUTCDate() !== day
	) {
		return null
	}
	return { year, month, day }
}

function shiftCalendarMonths(date: CalendarDate, months: number): CalendarDate {
	const monthIndex = date.month - 1 + months
	const year = date.year + Math.floor(monthIndex / 12)
	const month = ((monthIndex % 12) + 12) % 12
	const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
	return {
		year,
		month: month + 1,
		day: Math.min(date.day, lastDay),
	}
}

function compareCalendarDate(left: CalendarDate, right: CalendarDate): number {
	if (left.year !== right.year) {
		return left.year - right.year
	}
	if (left.month !== right.month) {
		return left.month - right.month
	}
	return left.day - right.day
}

function isMoreThanOneMonthAgo(value: unknown, today = new Date()): boolean {
	const date = toCalendarDate(value)
	if (!date) {
		return false
	}
	const current: CalendarDate = {
		year: today.getFullYear(),
		month: today.getMonth() + 1,
		day: today.getDate(),
	}
	const threshold = shiftCalendarMonths(current, -1)
	return compareCalendarDate(date, threshold) < 0
}

function isMemberBlocked(
	member: Record<string, unknown>,
	isBreeder: boolean,
): boolean {
	if(isBreeder) return true
	const joinedLongAgo = isMoreThanOneMonthAgo(member.DateOfJoining)
	const leavingUnset = toCalendarDate(member.DateOfLeaving) === null
	return ! (joinedLongAgo && leavingUnset)
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
	const membershipLabel = membershipNumber === null
		? ''
		: String(membershipNumber)
	const username = isBreeder || membershipLabel.length < MIN_USERNAME_LENGTH
		? `c.${cId}`
		: membershipLabel

	const data: TargetData = {
		username,
		email: `c.${cId}@hovawarte.com`,
		provider: 'local',
		confirmed: true,
		blocked: isMemberBlocked(member, isBreeder),
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

async function findOtherUserByEmail(
	strapi: Core.Strapi,
	email: string,
	existing: { id?: number } | null,
): Promise<{ id?: number; cId?: number } | null> {
	const where: Record<string, unknown> = {
		email: { $eqi: email },
	}
	if (typeof existing?.id === 'number') {
		where.id = { $ne: existing.id }
	}
	const taken = await strapi.db.query(USER_UID).findOne({
		where,
		select: ['id', 'cId'],
	}) as { id?: number; cId?: number } | null
	return taken ?? null
}

function otherUserLabel(user: { id?: number; cId?: number }): string {
	return typeof user.cId === 'number' ? `cId=${user.cId}` : `id=${user.id}`
}

async function applyUniqueMemberEmail(
	strapi: Core.Strapi,
	data: TargetData,
	existing: { id?: number; documentId?: string } | null,
	cId: number,
	log: (line: string) => void,
) {
	const memberEmail = typeof data.cEmail === 'string' ? data.cEmail : null
	const placeholder = `c.${cId}@hovawarte.com`

	if (memberEmail) {
		const taken = await findOtherUserByEmail(strapi, memberEmail, existing)
		if (!taken) {
			data.email = memberEmail
			log(`CS_Member cId=${cId}: user.email übernommen (${memberEmail})`)
			return
		}
		log(
			`CS_Member cId=${cId}: Email ${memberEmail} ist bereits bei ${otherUserLabel(taken)} vergeben, user.email wird nicht übernommen`,
		)
	}

	if (existing) {
		delete data.email
		return
	}

	const placeholderTaken = await findOtherUserByEmail(
		strapi,
		placeholder,
		null,
	)
	if (!placeholderTaken) {
		data.email = placeholder
		return
	}

	const fallback = `c.${cId}.import@hovawarte.com`
	const fallbackTaken = await findOtherUserByEmail(strapi, fallback, null)
	data.email = fallbackTaken
		? `c.${cId}.${Date.now()}@hovawarte.com`
		: fallback
	log(
		`CS_Member cId=${cId}: Platzhalter ${placeholder} ist vergeben, user.email=${data.email}`,
	)
}

async function omitTakenMembershipNumber(
	strapi: Core.Strapi,
	data: TargetData,
	existing: { id?: number; documentId?: string } | null,
	cId: number,
	log: (line: string) => void,
) {
	const membershipNumber = data.membershipNumber
	if (typeof membershipNumber !== 'number') {
		return
	}

	const where: Record<string, unknown> = { membershipNumber }
	if (typeof existing?.id === 'number') {
		where.id = { $ne: existing.id }
	}
	const taken = await strapi.db.query(USER_UID).findOne({
		where,
		select: ['id', 'cId'],
	}) as { id?: number; cId?: number } | null
	if (!taken) {
		return
	}

	if (data.username === String(membershipNumber)) {
		data.username = `c.${cId}`
	}
	delete data.membershipNumber
	const owner = typeof taken.cId === 'number' ? `cId=${taken.cId}` : `id=${taken.id}`
	log(
		`CS_Member cId=${cId}: membershipNumber ${membershipNumber} ist bereits bei ${owner} vergeben, Feld bleibt unverändert`,
	)
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
	options?: { copyMemberEmails?: boolean },
) {
	const cId = parseInteger(member.IdPerson)
	if (cId === null) {
		log('CS_Member ohne IdPerson, User-Update übersprungen')
		return
	}

	const data = mapMemberToUser(member, cId, authenticatedRoleId)
	const existing = await findByCId(strapi, USER_UID, cId)
	await omitTakenMembershipNumber(strapi, data, existing, cId, log)
	if (options?.copyMemberEmails) {
		await applyUniqueMemberEmail(strapi, data, existing, cId, log)
	} else if (existing) {
		delete data.email
	}
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

async function ensurePublishMyData(strapi: Core.Strapi, userId: number) {
	const user = await strapi.db.query(USER_UID).findOne({
		where: { id: userId },
		select: ['id', 'publishMyData'],
	}) as { publishMyData?: boolean } | null
	if (user?.publishMyData === true) {
		return
	}
	await strapi.db.query(USER_UID).update({
		where: { id: userId },
		data: { publishMyData: true },
	})
}

interface OwnerMemberUser {
	id: number
	cId?: number | null
	publishMyData?: boolean | null
	cFlagBreeder?: boolean | null
	firstName?: string | null
	lastName?: string | null
}

function ownerMemberLabel(user: OwnerMemberUser): string {
	const name = [user.firstName, user.lastName]
		.filter((part) => typeof part === 'string' && part.trim() !== '')
		.join(' ')
		.trim()
	const label = name || `id=${user.id}`
	const cIdLabel = typeof user.cId === 'number' ? ` cId=${user.cId}` : ''
	return `${label}${cIdLabel}`
}

async function loadOwnerMembers(
	strapi: Core.Strapi,
	breederId: number,
): Promise<OwnerMemberUser[]> {
	const breeder = await strapi.db.query(BREEDER_UID).findOne({
		where: { id: breederId },
		populate: {
			owner_members: {
				select: [
					'id',
					'cId',
					'publishMyData',
					'cFlagBreeder',
					'firstName',
					'lastName',
				],
			},
		},
	}) as { owner_members?: OwnerMemberUser[] } | null
	return Array.isArray(breeder?.owner_members) ? breeder.owner_members : []
}

async function prepareOwnerMembers(
	strapi: Core.Strapi,
	breederId: number | null,
	userId: number,
	log: (line: string) => void,
): Promise<Record<string, number[]> | null> {
	const linked = breederId === null
		? []
		: await loadOwnerMembers(strapi, breederId)
	const disconnect: number[] = []
	const keep: OwnerMemberUser[] = []

	for (const member of linked) {
		if (member.cFlagBreeder === true) {
			disconnect.push(member.id)
			log(
				`Owner-Member ${ownerMemberLabel(member)} aus der Relation entfernt, weil cFlagBreeder=true`,
			)
			continue
		}
		keep.push(member)
	}

	const current = await strapi.db.query(USER_UID).findOne({
		where: { id: userId },
		select: [
			'id',
			'cId',
			'publishMyData',
			'cFlagBreeder',
			'firstName',
			'lastName',
		],
	}) as OwnerMemberUser | null
	const currentIsFlagged = current?.cFlagBreeder === true
	const currentIsKept = linked.some(
		(entry) => entry.id === userId && entry.cFlagBreeder !== true,
	)
	if (current && !currentIsFlagged && !currentIsKept) {
		keep.push(current)
	}

	for (const member of keep) {
		if (member.publishMyData === true) {
			continue
		}
		await strapi.db.query(USER_UID).update({
			where: { id: member.id },
			data: { publishMyData: true },
		})
		log(
			`publishMyData für Owner-Member ${ownerMemberLabel(member)} auf true gesetzt`,
		)
	}

	const connect: number[] = []
	if (disconnect.length > 0 && current && !currentIsFlagged && !currentIsKept) {
		connect.push(userId)
	}
	if (disconnect.length === 0 && connect.length === 0) {
		return currentIsFlagged ? {} : null
	}
	const relation: Record<string, number[]> = {}
	if (disconnect.length > 0) {
		relation.disconnect = disconnect
	}
	if (connect.length > 0) {
		relation.connect = connect
	}
	return relation
}

function addressFromUser(user: Record<string, unknown>): TargetData | null {
	const address1 = truncateOrNull(cell(user.address1), 255)
	const zip = truncateOrNull(cell(user.zip), 5)
	const city = cell(user.city)
	const firstName = cell(user.firstName) ?? ''
	const lastName = cell(user.lastName) ?? ''
	const fullName = truncateOrNull(`${firstName} ${lastName}`.trim(), 255)
	if (!address1 && !zip && !city && !fullName) {
		return null
	}
	const country = cell(user.countryCode)
	const address: TargetData = {
		CountryCode: country && country.length === 2 ? country : 'DE',
	}
	assign(address, 'FullName', fullName)
	assign(address, 'Address1', address1)
	assign(address, 'Zip', zip)
	assign(address, 'City', city)
	return address
}

async function findBreederByRole(
	strapi: Core.Strapi,
	cId: number,
	role: 'B' | 'S',
) {
	const found = await strapi.db.query(BREEDER_UID).findOne({
		where: { cId, BreederRole: role },
		select: ['id', 'documentId'],
	})
	return found ?? null
}

export async function updateBreederFromUser(
	strapi: Core.Strapi,
	user: Record<string, unknown>,
	breedingStation: string | null,
	log: (line: string) => void,
) {
	const cId = parseInteger(user.cId)
	if (cId === null) {
		log('Züchter ohne cId, Update übersprungen')
		return
	}
	const storedUser = typeof user.id === 'number'
		? { id: user.id }
		: await findByCId(strapi, USER_UID, cId)
	const userId = typeof storedUser?.id === 'number' ? storedUser.id : null
	if (userId === null) {
		log(`Züchter cId=${cId} ohne User-ID, Update übersprungen`)
		return
	}

	const data: TargetData = {
		cId,
		member: userId,
	}
	const kennelName = truncateOrNull(breedingStation, 200)
	assign(data, 'kennelName', kennelName)
	assign(data, 'BreederEmail', parseEmail(user.cEmail))
	const address = addressFromUser(user)
	if (address) {
		data.Address = address
	}

	const existing = await findBreederByRole(strapi, cId, 'B')
	if (!existing) {
		const other = await strapi.db.query(BREEDER_UID).findOne({
			where: { cId },
			select: ['id', 'BreederRole'],
		}) as { BreederRole?: string } | null
		if (other) {
			log(
				`Züchter cId=${cId} existiert bereits als Rolle ${other.BreederRole ?? '?'}, nicht angelegt`,
			)
			return
		}
		data.BreederRole = 'B'
	}

	const ownerMembers = await prepareOwnerMembers(
		strapi,
		typeof existing?.id === 'number' ? existing.id : null,
		userId,
		log,
	)
	if (ownerMembers) {
		data.owner_members = ownerMembers
	}
	const savedId = await saveDocument(strapi, BREEDER_UID, existing, data)
	log(
		existing
			? `Züchter aktualisiert cId=${cId} documentId=${savedId}`
			: `Züchter erstellt cId=${cId} documentId=${savedId}`,
	)
}

export async function updateStudDog(
	strapi: Core.Strapi,
	dog: Record<string, unknown>,
	log: (line: string) => void,
) {
	const dogId = parseInteger(dog.cId)
	const ownerCId = parseInteger(dog.cOwnerId)
	const dogLabel = dogId === null ? '' : ` cId=${dogId}`
	if (ownerCId === null) {
		log(`Deckrüde${dogLabel} ohne Besitzer, Update übersprungen`)
		return
	}

	const owner = await strapi.db.query(USER_UID).findOne({
		where: { cId: ownerCId },
		select: [
			'id',
			'cId',
			'firstName',
			'lastName',
			'address1',
			'zip',
			'city',
			'countryCode',
			'cEmail',
		],
	}) as Record<string, unknown> | null
	const ownerId = typeof owner?.id === 'number' ? owner.id : null
	if (!owner || ownerId === null) {
		log(`Deckrüde${dogLabel}: Besitzer cId=${ownerCId} nicht gefunden`)
		return
	}

	const data: TargetData = {
		cId: ownerCId,
		member: ownerId,
	}
	assign(data, 'BreederEmail', parseEmail(owner.cEmail))
	const address = addressFromUser(owner)
	if (address) {
		data.Address = address
	}

	const existing = await findBreederByRole(strapi, ownerCId, 'S')
	if (!existing) {
		const other = await strapi.db.query(BREEDER_UID).findOne({
			where: { cId: ownerCId },
			select: ['id', 'BreederRole'],
		}) as { BreederRole?: string } | null
		if (other) {
			log(
				`Deckrüde${dogLabel}: Besitzer cId=${ownerCId} hat bereits Rolle ${other.BreederRole ?? '?'}, Profil nicht angelegt`,
			)
			return
		}
		const firstName = cell(owner.firstName) ?? ''
		const lastName = cell(owner.lastName) ?? ''
		const kennelName = truncateOrNull(`DRB ${firstName} ${lastName}`.trim(), 200)
		assign(data, 'kennelName', kennelName)
		data.BreederRole = 'S'
	}

	await ensurePublishMyData(strapi, ownerId)
	const savedId = await saveDocument(strapi, BREEDER_UID, existing, data)
	const linked = await findBreederByRole(strapi, ownerCId, 'S')
	if (typeof linked?.id === 'number') {
		await strapi.db.query(USER_UID).update({
			where: { id: ownerId },
			data: { deckrueden_info: linked.id },
		})
	}
	log(
		existing
			? `Deckrüde${dogLabel} aktualisiert, Besitzer cId=${ownerCId} documentId=${savedId}`
			: `Deckrüde${dogLabel} erstellt, Besitzer cId=${ownerCId} documentId=${savedId}`,
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

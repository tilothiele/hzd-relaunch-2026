import type { Core } from '@strapi/strapi'
import {
	BREEDER_STUD_OWNER_FIELDS,
	BREEDER_ZUECHTER_FIELDS,
	DOG_IMPORT_FIELDS,
	USER_IMPORT_FIELDS,
	applyFieldOverwrite,
	defaultCsImporterConfig,
	importFieldKeys,
	isStoredFieldEmpty,
	type CsFieldOverwriteMode,
	type CsImporterConfig,
} from '../cs-importer-config'

const USER_UID = 'plugin::users-permissions.user'
const USER_GROUP_UID = 'api::user-group.user-group'
const STUD_DOG_OWNER_GROUP_KEY = 'dr-besitzer'
const MIN_USERNAME_LENGTH = 3
const DOG_UID = 'plugin::hzd-plugin.dog'
const BREEDER_UID = 'plugin::hzd-plugin.breeder'
const CS_MEMBER_UID = 'api::cs-member.cs-member'

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

const USER_SCALAR_FIELDS = importFieldKeys(USER_IMPORT_FIELDS)
	.filter((key) => key !== 'role' && key !== 'deckrueden_info')
const DOG_SCALAR_FIELDS = importFieldKeys(DOG_IMPORT_FIELDS)
const BREEDER_SCALAR_FIELDS = [
	'kennelName',
	'IsActive',
	'BreederEmail',
	'cBreederEmail',
	'Phone',
	'cPhone',
	'BreederRole',
]

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

function emailRejectionReason(value: unknown): string | null {
	const cleaned = cell(value)
	if (!cleaned) {
		return 'Email ist leer'
	}
	const email = cleaned.toLowerCase()
	if (!email.includes('@')) {
		return `Email "${cleaned}" hat eine falsche Schreibweise (enthält kein @)`
	}
	if (email.includes(' ')) {
		return `Email "${cleaned}" hat eine falsche Schreibweise (enthält ein Leerzeichen)`
	}
	if (email.endsWith('.')) {
		return `Email "${cleaned}" hat eine falsche Schreibweise (endet auf einen Punkt)`
	}
	return null
}

function parseEmail(value: unknown): string | null {
	if (emailRejectionReason(value)) {
		return null
	}
	const cleaned = cell(value)
	if (!cleaned) {
		return null
	}
	return truncate(cleaned.toLowerCase(), 255)
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

	// Immer aus CS_Member übernommen (auch geleert, wenn der Wert leer ist):
	data.cEmail = parseEmail(member.Email)
	data.cFlagAccess = parseBoolean(member.C01Access)
	data.memberSince = parseDate(member.DateOfJoining)
	data.cancellationOn = parseDate(member.DateOfLeaving)
	data.membershipNumber = membershipNumber
	data.region = parseRegion(member.Oblast)
	data.dateOfBirth = parseDate(member.DateOfBirth)
	data.dateOfDeath = parseDate(member.DateOfDeath)

	// Nur setzen, wenn vorhanden (leere Werte überschreiben keine Bestandsdaten):
	assign(data, 'title', cell(member.Title))
	assign(data, 'firstName', cell(member.Firstname))
	assign(data, 'lastName', cell(member.Lastname))
	assign(data, 'address1', truncateOrNull(cell(member.Street), 100))
	assign(data, 'zip', truncateOrNull(cell(member.Zipcode), 5))
	assign(data, 'city', cell(member.City))
	assign(data, 'countryCode', parseCountryCode(member.Country))
	assign(data, 'phone', truncateOrNull(phone, 50))
	assign(data, 'sex', lookup(member.Salutation, USER_SEX_MAP))
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

async function loadStoredTarget(
	strapi: Core.Strapi,
	uid: string,
	existing: { id?: number; documentId?: string },
	select: string[],
	populate?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
	const where = typeof existing.id === 'number'
		? { id: existing.id }
		: existing.documentId
			? { documentId: existing.documentId }
			: null
	if (!where) {
		return {}
	}
	const found = await strapi.db.query(uid).findOne({
		where,
		select,
		populate,
	})
	return (found ?? {}) as Record<string, unknown>
}

function isUserFieldEmpty(fieldName: string, value: unknown): boolean {
	if (
		fieldName === 'email'
		&& canOverwriteUserEmail(typeof value === 'string' ? value : null)
	) {
		return true
	}
	return isStoredFieldEmpty(fieldName, value)
}

const DRY_RUN_META_KEYS = new Set(['id', 'documentId', '__component'])

function dryRunScalar(value: unknown): string {
	if (value === null || value === undefined) {
		return ''
	}
	if (value instanceof Date) {
		return value.toISOString()
	}
	if (
		typeof value === 'string'
		|| typeof value === 'number'
		|| typeof value === 'boolean'
	) {
		return String(value)
	}
	if (Array.isArray(value)) {
		return JSON.stringify(value.map((entry) => dryRunScalar(entry)))
	}
	if (typeof value === 'object') {
		const record = value as Record<string, unknown>
		const contentKeys = Object.keys(record).filter(
			(key) => !DRY_RUN_META_KEYS.has(key),
		)
		if (
			'id' in record
			&& contentKeys.length === 0
			&& (
				typeof record.id === 'number'
				|| typeof record.id === 'string'
			)
		) {
			return String(record.id)
		}
		const content: Record<string, string> = {}
		for (const key of contentKeys.sort()) {
			content[key] = dryRunScalar(record[key])
		}
		return JSON.stringify(content)
	}
	return String(value)
}

function formatDryRunValue(value: string): string {
	return value === '' ? '–' : JSON.stringify(value)
}

function logPlannedWrite(
	log: (line: string) => void,
	kind: 'Insert' | 'Update',
	entity: string,
	cId: number,
	data: TargetData,
	stored: Record<string, unknown> | null,
	options?: { newPassword?: boolean },
) {
	const lines: string[] = []
	for (const key of Object.keys(data)) {
		if (key === 'password' || key === 'cId') {
			continue
		}
		const before = stored ? dryRunScalar(stored[key]) : ''
		const after = dryRunScalar(data[key])
		if (kind === 'Update' && before === after) {
			continue
		}
		lines.push(
			`  ${key}: ${formatDryRunValue(before)} → ${formatDryRunValue(after)}`,
		)
	}
	if (options?.newPassword) {
		lines.push('  password: – → (neues Passwort)')
	}
	if (kind === 'Update' && lines.length === 0) {
		return
	}
	log(`Dry run: ${entity} ${kind} cId=${cId}`)
	for (const line of lines) {
		log(line)
	}
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

const PLACEHOLDER_USER_EMAIL = /^c\.[0-9]*@hovawarte\.com$/i

function canOverwriteUserEmail(email: string | null | undefined): boolean {
	if (email == null) {
		return true
	}
	const trimmed = email.trim()
	if (!trimmed) {
		return true
	}
	return PLACEHOLDER_USER_EMAIL.test(trimmed)
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
	importerConfig: CsImporterConfig = defaultCsImporterConfig(),
	dryRun = false,
) {
	const cId = parseInteger(member.IdPerson)
	if (cId === null) {
		log('CS_Member ohne IdPerson, User-Update übersprungen')
		return
	}
	if (parseBoolean(member.PersonIsABreeder) === true) {
		log(
			`CS_Member cId=${cId}: PersonIsABreeder=true, User wird nicht angelegt oder aktualisiert`,
		)
		return
	}

	const data = mapMemberToUser(member, cId, authenticatedRoleId)
	const existing = await findByCId(strapi, USER_UID, cId)
	await omitTakenMembershipNumber(strapi, data, existing, cId, log)
	const stored = existing
		? await loadStoredTarget(
			strapi,
			USER_UID,
			existing,
			USER_SCALAR_FIELDS,
			{
				role: { select: ['id'] },
				deckrueden_info: { select: ['id'] },
			},
		)
		: null
	const storedEmail = typeof stored?.email === 'string' ? stored.email : null
	const emailMode = importerConfig.user.email
	const mayOverwriteEmail = !existing
		|| emailMode === 'overwrite'
		|| (
			emailMode === 'fillIfEmpty'
			&& canOverwriteUserEmail(storedEmail)
		)
	const skipMemberEmailReasons = [
		data.blocked === true ? 'blocked=true' : null,
	].filter((reason): reason is string => reason !== null)
	const emailFormatReason = mayOverwriteEmail
		? emailRejectionReason(member.Email)
		: null
	if (mayOverwriteEmail && skipMemberEmailReasons.length === 0) {
		if (emailFormatReason) {
			log(
				`CS_Member cId=${cId}: ${emailFormatReason}, user.email wird nicht übernommen`,
			)
		}
		await applyUniqueMemberEmail(strapi, data, existing, cId, log)
	} else if (existing) {
		delete data.email
	}
	if (skipMemberEmailReasons.length > 0 && mayOverwriteEmail) {
		const reasons = emailFormatReason
			? [...skipMemberEmailReasons, emailFormatReason]
			: skipMemberEmailReasons
		log(
			`CS_Member cId=${cId}: ${reasons.join(', ')}, user.email wird nicht übernommen`,
		)
	} else if (
		!dryRun
		&& existing
		&& emailMode === 'fillIfEmpty'
		&& !mayOverwriteEmail
	) {
		log(
			`CS_Member cId=${cId}: user.email "${storedEmail}" wird nicht überschrieben`,
		)
	}
	if (stored) {
		applyFieldOverwrite(
			data,
			stored,
			importFieldKeys(USER_IMPORT_FIELDS),
			importerConfig.user,
			isUserFieldEmpty,
		)
	}
	if (!existing && !dryRun) {
		data.password = await hashPassword(strapi, `Import-${cId}-ChangeMe!`)
	}
	if (dryRun) {
		logPlannedWrite(
			log,
			existing ? 'Update' : 'Insert',
			'User',
			cId,
			data,
			stored,
			{ newPassword: !existing },
		)
		return
	}
	const savedId = await saveDocument(strapi, USER_UID, existing, data)
	log(
		existing
			? `User aktualisiert cId=${cId} documentId=${savedId}`
			: `User erstellt cId=${cId} documentId=${savedId}`,
	)
}

/**
 * Telefonnummer eines CS_Member für das Breeder-Attribut `Phone`.
 * Quelle ist ausschliesslich `CS_Member.Phone`.
 */
function phoneFromCsMember(member: Record<string, unknown>): string | null {
	return truncateOrNull(cell(member.Phone), 50)
}

/**
 * Ergebnis der CS_Member-Telefonnummern-Suche.
 *
 * `found` unterscheidet zwischen "kein CS_Member vorhanden" und
 * "CS_Member vorhanden, aber ohne Telefonnummer".
 */
export interface CsMemberPhone {
	found: boolean
	phone: string | null
}

/**
 * Liefert die Telefonnummer eines CS_Member zu einer Personen-ID.
 *
 * Primär wird der Datensatz der aktuell importierten Generation
 * verwendet. Gibt es dort keinen Datensatz, greift der neueste
 * vorhandene CS_Member als Rückfall.
 */
async function queryCsMemberPhone(
	strapi: Core.Strapi,
	cId: number,
	generation: number | null,
): Promise<CsMemberPhone> {
	const findMember = async (withGeneration: boolean) => {
		const where: Record<string, unknown> = { IdPerson: String(cId) }
		if (withGeneration && generation !== null) {
			where.Generation = generation
		}
		return strapi.db.query(CS_MEMBER_UID).findOne({
			where,
			orderBy: { Generation: 'desc' },
			select: ['Phone'],
		}) as { Phone?: string | null } | null
	}

	const member = generation === null
		? await findMember(false)
		: await findMember(true) ?? await findMember(false)
	if (!member) {
		return { found: false, phone: null }
	}
	return { found: true, phone: phoneFromCsMember(member) }
}

/**
 * Erzeugt eine Telefonnummern-Suche für CS_Member.
 *
 * Die Ergebnisse werden pro Importlauf zwischengespeichert, damit
 * bei mehreren Deckrüden desselben Besitzers nur eine Abfrage
 * entsteht.
 */
export function createCsMemberPhoneLookup(
	strapi: Core.Strapi,
	generation: number | null = null,
): (cId: number) => Promise<CsMemberPhone> {
	const cache = new Map<number, CsMemberPhone>()
	return async (cId: number) => {
		const cached = cache.get(cId)
		if (cached) {
			return cached
		}
		const result = await queryCsMemberPhone(strapi, cId, generation)
		cache.set(cId, result)
		return result
	}
}

/**
 * Bestehender Züchter bzw. Deckrüdenbesitzer mit Telefonnummer
 * und der aus dem Club-System übernommenen E-Mail.
 */
export interface BreederRecord {
	id?: number
	documentId?: string
	phone: string | null
	cPhone: string | null
	cBreederEmail: string | null
	kennelName: string | null
	isActive: boolean | null
	breederEmail: string | null
	address: Record<string, unknown> | null
	role: string | null
}

/**
 * Lädt alle Züchter mit cId, damit der CS_Member-Import nicht für
 * jeden Datensatz eine eigene Datenbankabfrage benötigt.
 */
export async function loadBreedersByCId(
	strapi: Core.Strapi,
): Promise<Map<number, BreederRecord>> {
	const breeders = await strapi.db.query(BREEDER_UID).findMany({
		select: [
			'id',
			'documentId',
			'cId',
			'Phone',
			'cPhone',
			'cBreederEmail',
			'kennelName',
			'IsActive',
			'BreederEmail',
			'BreederRole',
		],
		populate: { Address: true },
	}) as {
		id?: number
		documentId?: string
		cId?: number | null
		Phone?: string | null
		cPhone?: string | null
		cBreederEmail?: string | null
		kennelName?: string | null
		IsActive?: boolean | null
		BreederEmail?: string | null
		BreederRole?: string | null
		Address?: unknown
	}[]
	const byCId = new Map<number, BreederRecord>()
	for (const breeder of breeders) {
		if (typeof breeder.cId !== 'number') {
			continue
		}
		byCId.set(breeder.cId, breederRecordFromRow(breeder))
	}
	return byCId
}

function storedText(value: unknown): string | null {
	const text = typeof value === 'string' ? value.trim() : ''
	return text.length > 0 ? text : null
}

function storedEmail(value: unknown): string | null {
	const email = storedText(value)
	return email ? email.toLowerCase() : null
}

function storedBoolean(value: unknown): boolean | null {
	return typeof value === 'boolean' ? value : null
}

function storedAddress(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null
	}
	return value as Record<string, unknown>
}

function breederRecordFromRow(breeder: {
	id?: number
	documentId?: string
	Phone?: string | null
	cPhone?: string | null
	cBreederEmail?: string | null
	kennelName?: string | null
	IsActive?: boolean | null
	BreederEmail?: string | null
	BreederRole?: string | null
	Address?: unknown
}): BreederRecord {
	return {
		id: breeder.id,
		documentId: breeder.documentId,
		phone: storedText(breeder.Phone),
		cPhone: storedText(breeder.cPhone),
		cBreederEmail: storedEmail(breeder.cBreederEmail),
		kennelName: storedText(breeder.kennelName),
		isActive: storedBoolean(breeder.IsActive),
		breederEmail: storedEmail(breeder.BreederEmail),
		address: storedAddress(breeder.Address),
		role: typeof breeder.BreederRole === 'string' ? breeder.BreederRole : null,
	}
}

function breederStoredFields(
	record: BreederRecord,
): Record<string, unknown> {
	return {
		kennelName: record.kennelName,
		IsActive: record.isActive,
		BreederEmail: record.breederEmail,
		cBreederEmail: record.cBreederEmail,
		Phone: record.phone,
		cPhone: record.cPhone,
		Address: record.address,
		BreederRole: record.role,
	}
}

function rememberBreederFields(
	record: BreederRecord,
	data: TargetData,
) {
	if ('Phone' in data) {
		record.phone = storedText(data.Phone)
	}
	if ('cPhone' in data) {
		record.cPhone = storedText(data.cPhone)
	}
	if ('cBreederEmail' in data) {
		record.cBreederEmail = storedEmail(data.cBreederEmail)
	}
	if ('kennelName' in data) {
		record.kennelName = storedText(data.kennelName)
	}
	if ('IsActive' in data) {
		record.isActive = storedBoolean(data.IsActive)
	}
	if ('BreederEmail' in data) {
		record.breederEmail = storedEmail(data.BreederEmail)
	}
	if ('Address' in data) {
		record.address = storedAddress(data.Address)
	}
}

function breederFieldsFromMember(
	member: Record<string, unknown>,
	phone: string | null,
): TargetData {
	const data: TargetData = {
		cPhone: phone,
		cBreederEmail: parseEmail(member.Email),
	}
	assign(data, 'kennelName', truncateOrNull(cell(member.BreedingStation), 200))
	assign(data, 'IsActive', parseBoolean(member.PersonIsAnActiveBreeder))
	const email = parseEmail(member.Email)
	assign(data, 'BreederEmail', email)
	assign(data, 'Phone', phone)
	const address = addressFromCsMember(member)
	if (address) {
		data.Address = address
	}
	return data
}

export async function ensureBreederForCsMember(
	strapi: Core.Strapi,
	member: Record<string, unknown>,
	log: (line: string) => void,
	breedersByCId?: Map<number, BreederRecord>,
	importerConfig: CsImporterConfig = defaultCsImporterConfig(),
	dryRun = false,
) {
	const cId = parseInteger(member.IdPerson)
	if (cId === null) {
		log('CS_Member ohne IdPerson, Breeder-Anlage übersprungen')
		return
	}
	const phone = phoneFromCsMember(member)
	const cached = breedersByCId?.get(cId)
	const existing = cached
		?? (breedersByCId ? null : await findByCId(strapi, BREEDER_UID, cId))
	const data = breederFieldsFromMember(member, phone)
	const rawEmail = cell(member.Email)
	const emailReason = emailRejectionReason(member.Email)
	if (existing) {
		if (typeof existing.id !== 'number' && !existing.documentId) {
			return
		}
		const stored = cached
			? breederStoredFields(cached)
			: await loadStoredTarget(
				strapi,
				BREEDER_UID,
				existing,
				BREEDER_SCALAR_FIELDS,
				{ Address: true },
			)
		const storedPhone = storedText(stored.Phone)
		const finalCPhone = typeof data.cPhone === 'string' ? data.cPhone : null
		if (
			storedPhone !== finalCPhone
			&& (storedPhone !== null || finalCPhone !== null)
		) {
			log(
				`CS_Member cId=${cId}: Breeder Phone und cPhone weichen ab: Phone="${storedPhone ?? '–'}" cPhone="${finalCPhone ?? '–'}"`,
			)
		}
		const isStudOwner = stored.BreederRole === 'S' || cached?.role === 'S'
		if (isStudOwner) {
			const studData: TargetData = {
				cPhone: data.cPhone,
				cBreederEmail: data.cBreederEmail,
			}
			applyFieldOverwrite(
				studData,
				stored,
				['cPhone', 'cBreederEmail'],
				importerConfig.breeder.deckruedenbesitzer,
			)
			for (const key of Object.keys(data)) {
				delete data[key]
			}
			Object.assign(data, studData)
		} else {
			applyFieldOverwrite(
				data,
				stored,
				importFieldKeys(BREEDER_ZUECHTER_FIELDS),
				importerConfig.breeder.zuechter,
			)
		}
		if (rawEmail && emailReason) {
			log(
				'cBreederEmail' in data && data.cBreederEmail == null
					? `CS_Member cId=${cId}: ${emailReason}, cBreederEmail wird geleert`
					: `CS_Member cId=${cId}: ${emailReason}, cBreederEmail bleibt unverändert`,
			)
		}
		if (dryRun) {
			logPlannedWrite(log, 'Update', 'Breeder', cId, data, stored)
		} else {
			await saveDocument(strapi, BREEDER_UID, existing, data)
		}
		if (cached) {
			rememberBreederFields(cached, data)
		}
		if (!dryRun) {
			log(
				`Breeder aktualisiert cId=${cId} documentId=${existing.documentId ?? existing.id}`,
			)
		}
		return
	}
	if (parseBoolean(member.PersonIsABreeder) !== true) {
		return
	}
	if (rawEmail && emailReason) {
		log(
			`CS_Member cId=${cId}: ${emailReason}, cBreederEmail bleibt leer`,
		)
	}
	data.cId = cId
	data.BreederRole = 'B'
	if (dryRun) {
		logPlannedWrite(log, 'Insert', 'Breeder', cId, data, null)
	}
	const savedId = dryRun
		? ''
		: await saveDocument(strapi, BREEDER_UID, null, data)
	if (breedersByCId) {
		const created = breederRecordFromRow({
			documentId: savedId,
			Phone: typeof data.Phone === 'string' ? data.Phone : null,
			cPhone: typeof data.cPhone === 'string' ? data.cPhone : null,
			cBreederEmail: typeof data.cBreederEmail === 'string'
				? data.cBreederEmail
				: null,
			kennelName: typeof data.kennelName === 'string' ? data.kennelName : null,
			IsActive: typeof data.IsActive === 'boolean' ? data.IsActive : null,
			BreederEmail: typeof data.BreederEmail === 'string'
				? data.BreederEmail
				: null,
			BreederRole: 'B',
			Address: data.Address,
		})
		breedersByCId.set(cId, created)
	}
	if (!dryRun) {
		log(`Breeder erstellt cId=${cId} documentId=${savedId}`)
	}
}

async function ensurePublishMyData(
	strapi: Core.Strapi,
	userId: number,
	mode: CsFieldOverwriteMode,
) {
	if (mode === 'keep') {
		return
	}
	const user = await strapi.db.query(USER_UID).findOne({
		where: { id: userId },
		select: ['id', 'publishMyData'],
	}) as { publishMyData?: boolean | null } | null
	if (
		mode === 'fillIfEmpty'
		&& !isStoredFieldEmpty('publishMyData', user?.publishMyData)
	) {
		return
	}
	if (user?.publishMyData === true) {
		return
	}
	await strapi.db.query(USER_UID).update({
		where: { id: userId },
		data: { publishMyData: true },
	})
}

function addressFromCsMember(member: Record<string, unknown>): TargetData | null {
	const address1 = truncateOrNull(cell(member.Street), 255)
	const zip = truncateOrNull(cell(member.Zipcode), 5)
	const city = cell(member.City)
	const firstName = cell(member.Firstname) ?? ''
	const lastName = cell(member.Lastname) ?? ''
	const fullName = truncateOrNull(`${firstName} ${lastName}`.trim(), 255)
	if (!address1 && !zip && !city && !fullName) {
		return null
	}
	const country = parseCountryCode(member.Country)
	const address: TargetData = {
		CountryCode: country && country.length === 2 ? country : 'DE',
	}
	assign(address, 'FullName', fullName)
	assign(address, 'Address1', address1)
	assign(address, 'Zip', zip)
	assign(address, 'City', city)
	return address
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

function relationKeys(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return []
	}
	return value.flatMap((entry) => {
		if (!entry || typeof entry !== 'object' || !('key' in entry)) {
			return []
		}
		const key = (entry as { key?: unknown }).key
		return typeof key === 'string' ? [key] : []
	})
}

let studDogOwnerGroupMissingLogged = false

async function ensureStudDogOwnerGroup(
	strapi: Core.Strapi,
	owner: Record<string, unknown>,
	log: (line: string) => void,
) {
	if (relationKeys(owner.user_groups).includes(STUD_DOG_OWNER_GROUP_KEY)) {
		return
	}
	const group = await strapi.db.query(USER_GROUP_UID).findOne({
		where: { key: STUD_DOG_OWNER_GROUP_KEY },
		select: ['id', 'documentId'],
	}) as { id?: number; documentId?: string } | null
	if (typeof group?.id !== 'number') {
		if (!studDogOwnerGroupMissingLogged) {
			studDogOwnerGroupMissingLogged = true
			log(
				`UserGroup key=${STUD_DOG_OWNER_GROUP_KEY} nicht gefunden, Besitzer werden nicht zugeordnet`,
			)
		}
		return
	}
	const documentId = typeof owner.documentId === 'string' ? owner.documentId : ''
	if (documentId) {
		await strapi.documents(USER_UID as never).update({
			documentId,
			data: {
				user_groups: { connect: [group.id] },
			} as never,
		})
	} else if (typeof owner.id === 'number') {
		await strapi.db.query(USER_UID).update({
			where: { id: owner.id },
			data: {
				user_groups: { connect: [group.id] },
			},
		})
	} else {
		throw new Error('Besitzer ohne id')
	}
	const cId = typeof owner.cId === 'number' ? ` cId=${owner.cId}` : ''
	log(`Besitzer${cId} in die Gruppe ${STUD_DOG_OWNER_GROUP_KEY} aufgenommen`)
}

/**
 * Telefonnummer für das Breeder-Profil eines Deckrüdenbesitzers.
 *
 * Vorrang hat `CS_Member.Phone`, weil das Attribut `Breeder.Phone`
 * ausschliesslich aus CS befüllt wird. Die Telefonnummer des
 * Benutzerkontos dient nur als Rückfall, wenn kein CS_Member
 * vorhanden ist.
 */
async function resolveStudDogPhone(
	ownerCId: number,
	ownerPhone: unknown,
	loadCsMemberPhone?: (cId: number) => Promise<CsMemberPhone>,
): Promise<string | null> {
	if (loadCsMemberPhone) {
		const csMember = await loadCsMemberPhone(ownerCId)
		if (csMember.found) {
			return csMember.phone
		}
	}

	return truncateOrNull(cell(ownerPhone), 50)
}

async function linkDeckruedenInfo(
	strapi: Core.Strapi,
	ownerId: number,
	breederId: number,
	mode: CsFieldOverwriteMode,
) {
	if (mode === 'keep') {
		return
	}
	if (mode === 'fillIfEmpty') {
		const owner = await strapi.db.query(USER_UID).findOne({
			where: { id: ownerId },
			populate: { deckrueden_info: { select: ['id'] } },
		}) as { deckrueden_info?: { id?: number } | null } | null
		if (!isStoredFieldEmpty(
			'deckrueden_info',
			owner?.deckrueden_info ?? null,
		)) {
			return
		}
	}
	await strapi.db.query(USER_UID).update({
		where: { id: ownerId },
		data: { deckrueden_info: breederId },
	})
}

export async function updateStudDog(
	strapi: Core.Strapi,
	dog: Record<string, unknown>,
	log: (line: string) => void,
	options?: {
		fixGroups?: boolean
		loadCsMemberPhone?: (cId: number) => Promise<CsMemberPhone>
		importerConfig?: CsImporterConfig
	},
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
			'documentId',
			'cId',
			'firstName',
			'lastName',
			'address1',
			'zip',
			'city',
			'countryCode',
			'cEmail',
			'phone',
		],
		populate: {
			user_groups: {
				select: ['key'],
			},
		},
	}) as Record<string, unknown> | null
	const ownerId = typeof owner?.id === 'number' ? owner.id : null
	if (!owner || ownerId === null) {
		log(`Deckrüde${dogLabel}: Besitzer cId=${ownerCId} nicht gefunden`)
		return
	}

	if (options?.fixGroups === true) {
		await ensureStudDogOwnerGroup(strapi, owner, log)
	}

	const importerConfig = options?.importerConfig ?? defaultCsImporterConfig()
	const email = parseEmail(owner.cEmail)
	const firstName = cell(owner.firstName) ?? ''
	const lastName = cell(owner.lastName) ?? ''
	const data: TargetData = {
		cId: ownerCId,
		member: ownerId,
	}
	assign(data, 'cBreederEmail', email)
	assign(data, 'BreederEmail', email)
	assign(data, 'Phone', await resolveStudDogPhone(
		ownerCId,
		owner.phone,
		options?.loadCsMemberPhone,
	))
	assign(
		data,
		'kennelName',
		truncateOrNull(`DRB ${firstName} ${lastName}`.trim(), 200),
	)
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
		data.BreederRole = 'S'
	} else {
		const stored = await loadStoredTarget(
			strapi,
			BREEDER_UID,
			existing,
			BREEDER_SCALAR_FIELDS,
			{
				Address: true,
				member: { select: ['id'] },
			},
		)
		applyFieldOverwrite(
			data,
			stored,
			importFieldKeys(BREEDER_STUD_OWNER_FIELDS),
			importerConfig.breeder.deckruedenbesitzer,
		)
	}

	await ensurePublishMyData(
		strapi,
		ownerId,
		importerConfig.user.publishMyData,
	)
	const savedId = await saveDocument(strapi, BREEDER_UID, existing, data)
	const linked = await findBreederByRole(strapi, ownerCId, 'S')
	if (typeof linked?.id === 'number') {
		await linkDeckruedenInfo(
			strapi,
			ownerId,
			linked.id,
			importerConfig.user.deckrueden_info,
		)
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
	importerConfig: CsImporterConfig = defaultCsImporterConfig(),
	dryRun = false,
) {
	const cId = parseInteger(dog.IdAnimal)
	if (cId === null) {
		log('CS_Dog ohne IdAnimal, Dog-Update übersprungen')
		return
	}

	const data = mapDogToTarget(dog, cId)
	const existing = await findByCId(strapi, DOG_UID, cId)
	const stored = existing
		? await loadStoredTarget(
			strapi,
			DOG_UID,
			existing,
			DOG_SCALAR_FIELDS,
		)
		: null
	if (stored) {
		applyFieldOverwrite(
			data,
			stored,
			importFieldKeys(DOG_IMPORT_FIELDS),
			importerConfig.dog,
		)
	}
	if (dryRun) {
		logPlannedWrite(
			log,
			existing ? 'Update' : 'Insert',
			'Dog',
			cId,
			data,
			stored,
		)
		return
	}
	const savedId = await saveDocument(strapi, DOG_UID, existing, data)
	log(
		existing
			? `Dog aktualisiert cId=${cId} documentId=${savedId}`
			: `Dog erstellt cId=${cId} documentId=${savedId}`,
	)
}

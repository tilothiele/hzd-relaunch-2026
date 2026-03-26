import { promises as fs } from 'fs'

interface ChromosoftUser {
	cId: number
	cFlagAccess: boolean
	title: string | null
	firstName: string | null
	lastName: string | null
	language: string | null
	address1: string | null
	zip: string | null
	city: string | null
	region: string | null
	country: string | null
	organization: string | null
	mobile: string | null
	phone: string | null
	email: string | null
	personIsBreeder: boolean
	membershipNumber: number | null
	memberSince: string | null
	cancellationOn: string | null
	dateOfBirth: string | null
	dateOfDeath: string | null
	breedingStation: string | null
}

const HZD_REGION_MAP: Record<string, string> = {
	nord: 'Nord',
	ost: 'Ost',
	mitte: 'Mitte',
	west: 'West',
	süd: 'Süd',
	sud: 'Süd',
}

const COUNTRY_CODE_MAP: Record<string, string> = {
	deutschland: 'DE',
	de: 'DE',
	österreich: 'AT',
	oesterreich: 'AT',
	at: 'AT',
	schweiz: 'CH',
	ch: 'CH',
}

function normalizeHeader(value: string): string {
	return value.trim().toLowerCase()
}

function normalizeCell(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null
	}

	const trimmed = value.trim()
	if (trimmed === '' || trimmed === '-') {
		return null
	}

	return trimmed
}

function parseBooleanCell(value: unknown): boolean {
	const normalized = normalizeCell(value)
	return normalized === '1' || normalized?.toLowerCase() === 'true'
}

function parseIntCell(value: unknown): number | null {
	const normalized = normalizeCell(value)
	if (!normalized) {
		return null
	}

	const parsed = Number.parseInt(normalized, 10)
	return Number.isNaN(parsed) ? null : parsed
}

function parseDateCell(value: unknown): string | null {
	const normalized = normalizeCell(value)
	if (!normalized) {
		return null
	}

	const [day, month, year] = normalized.split('/')
	if (!day || !month || !year) {
		return null
	}

	const normalizedDay = day.padStart(2, '0')
	const normalizedMonth = month.padStart(2, '0')
	const iso = `${year}-${normalizedMonth}-${normalizedDay}`

	return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null
}

function normalizeCsvEmail(value: unknown): string | null {
	const normalized = normalizeCell(value)
	if (!normalized) {
		return null
	}

	const email = normalized.toLowerCase()
	if (!email.includes('@')) {
		return null
	}

	return email
}

function generateStrapiLoginId(cId: number): string {
	return `user-${cId}`
}

function generateStrapiMail(cId: number): string {
	return `${generateStrapiLoginId(cId)}@hovawarte.com`
}

function parseCsvLine(line: string): string[] {
	const result: string[] = []
	let current = ''
	let inQuotes = false

	for (let i = 0; i < line.length; i += 1) {
		const char = line[i]
		const nextChar = i < line.length - 1 ? line[i + 1] : ''

		if (char === '"' && inQuotes && nextChar === '"') {
			current += '"'
			i += 1
			continue
		}

		if (char === '"') {
			inQuotes = !inQuotes
			continue
		}

		if (char === ',' && !inQuotes) {
			result.push(current)
			current = ''
			continue
		}

		current += char
	}

	result.push(current)
	return result
}

function parseCsv(content: string): Array<Record<string, string>> {
	const lines = content
		.split(/\r?\n/)
		.map((line) => line.trimEnd())
		.filter((line) => line.trim() !== '')

	if (lines.length < 2) {
		return []
	}

	const headers = parseCsvLine(lines[0]).map(normalizeHeader)
	const rows: Array<Record<string, string>> = []

	for (let i = 1; i < lines.length; i += 1) {
		const values = parseCsvLine(lines[i])
		const row: Record<string, string> = {}
		const maxLength = Math.max(headers.length, values.length)

		for (let index = 0; index < maxLength; index += 1) {
			const header = headers[index] ?? `__col_${index}`
			row[header] = values[index] ?? ''
		}

		rows.push(row)
	}

	return rows
}

function mapRowToChromosoftUser(row: Record<string, string>): ChromosoftUser | null {
	const cId = parseIntCell(row['id person'])
	if (!cId) {
		return null
	}

	const rawCountry = normalizeCell(row.country)
	const countryCode = rawCountry
		? (COUNTRY_CODE_MAP[rawCountry.toLowerCase()] ?? null)
		: null
	const rawRegion = normalizeCell(row.oblast)
	const region = rawRegion
		? (HZD_REGION_MAP[rawRegion.toLowerCase()] ?? null)
		: null

	return {
		cId,
		cFlagAccess: parseBooleanCell(row['0/1 access']),
		title: normalizeCell(row.title),
		firstName: normalizeCell(row.firstname),
		lastName: normalizeCell(row.lastname),
		language: normalizeCell(row.language),
		address1: normalizeCell(row.street),
		zip: normalizeCell(row.zipcode),
		city: normalizeCell(row.city),
		region,
		country: countryCode,
		organization: normalizeCell(row.organization),
		mobile: normalizeCell(row.mobile),
		phone: normalizeCell(row.phone),
		email: normalizeCsvEmail(row.email),
		personIsBreeder: parseBooleanCell(row['person is a breeder']),
		membershipNumber: parseIntCell(row['membership number']),
		memberSince: parseDateCell(row['date of joining']),
		cancellationOn: parseDateCell(row['date of leaving']),
		dateOfBirth: parseDateCell(row['date of birth']),
		dateOfDeath: parseDateCell(row['date of death']),
		breedingStation: normalizeCell(row['breeding station']),
	}
}

async function readRawStream(req: NodeJS.ReadableStream): Promise<string> {
	const chunks: Buffer[] = []

	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
	}

	return Buffer.concat(chunks).toString('utf8')
}

const controller = () => ({
	async importCsv(ctx: any) {
		let csvContent = ''

		const file = (ctx.request as any)?.files?.file
		if (file?.filepath) {
			csvContent = await fs.readFile(file.filepath, 'utf8')
		} else if (typeof ctx.request?.body === 'string') {
			csvContent = ctx.request.body
		} else if (typeof ctx.request?.body?.csv === 'string') {
			csvContent = ctx.request.body.csv
		} else {
			csvContent = await readRawStream(ctx.req)
		}

		if (!csvContent || csvContent.trim() === '') {
			return ctx.badRequest('CSV payload fehlt oder ist leer')
		}

		const rows = parseCsv(csvContent)
		const chromosoftUsers = rows
			.map(mapRowToChromosoftUser)
			.filter((row): row is ChromosoftUser => row !== null)

		if (chromosoftUsers.length === 0) {
			return ctx.badRequest('Keine importierbaren Datensätze in CSV gefunden')
		}

		const stats = {
			total: chromosoftUsers.length,
			usersCreated: 0,
			usersUpdated: 0,
			breedersUpserted: 0,
			emailsRewritten: 0,
		}

		for (const cu of chromosoftUsers) {
			const wu1 = await strapi.db
				.query('plugin::users-permissions.user')
				.findOne({
					where: { cId: cu.cId },
					select: ['id', 'cId', 'documentId', 'email'],
				})

			if (cu.email) {
				const wu2List = await strapi.db
					.query('plugin::users-permissions.user')
					.findMany({
						where: { email: cu.email },
						select: ['id', 'cId', 'documentId', 'email'],
					})

				for (const duplicateUser of wu2List) {
					if (wu1 && duplicateUser.id === wu1.id) {
						continue
					}

					const rewritten = generateStrapiMail(duplicateUser.cId || duplicateUser.id)
					if (duplicateUser.email === rewritten) {
						continue
					}

					await strapi.db.query('plugin::users-permissions.user').update({
						where: { id: duplicateUser.id },
						data: { email: rewritten },
					})

					stats.emailsRewritten += 1
				}
			}

			const username = generateStrapiLoginId(cu.cId)
			const targetEmail = cu.email ?? generateStrapiMail(cu.cId)

			const userData = {
				username,
				email: targetEmail,
				cEmail: cu.email,
				provider: 'local',
				password: `Import-${cu.cId}-ChangeMe!`,
				confirmed: true,
				blocked: false,
				title: cu.title,
				firstName: cu.firstName,
				lastName: cu.lastName,
				address1: cu.address1,
				zip: cu.zip,
				city: cu.city,
				phone: cu.mobile ?? cu.phone,
				cId: cu.cId,
				cFlagBreeder: cu.personIsBreeder,
				cFlagAccess: cu.cFlagAccess,
				memberSince: cu.memberSince,
				cancellationOn: cu.cancellationOn,
				membershipNumber: cu.membershipNumber,
				dateOfBirth: cu.dateOfBirth,
				dateOfDeath: cu.dateOfDeath,
				region: cu.region,
				countryCode: cu.country,
			}

			let persistedUser = wu1
			if (wu1) {
				await strapi.db.query('plugin::users-permissions.user').update({
					where: { id: wu1.id },
					data: userData,
				})
				stats.usersUpdated += 1
			} else {
				persistedUser = await strapi.db
					.query('plugin::users-permissions.user')
					.create({
						data: userData,
						select: ['id', 'cId', 'documentId', 'email'],
					})
				stats.usersCreated += 1
			}

			if (cu.personIsBreeder) {
				const existingBreeder = await strapi.db
					.query('plugin::hzd-plugin.breeder')
					.findOne({
						where: { cId: cu.cId },
						select: ['id'],
					})

				const breederData = {
					cId: cu.cId,
					kennelName: cu.breedingStation,
					member: persistedUser?.id ?? wu1?.id,
				}

				if (existingBreeder) {
					await strapi.db.query('plugin::hzd-plugin.breeder').update({
						where: { id: existingBreeder.id },
						data: breederData,
					})
				} else {
					await strapi.db.query('plugin::hzd-plugin.breeder').create({
						data: breederData,
					})
				}

				stats.breedersUpserted += 1
			}
		}

		ctx.body = {
			success: true,
			stats,
		}
	},
})

export default controller

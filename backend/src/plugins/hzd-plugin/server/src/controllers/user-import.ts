import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import path from 'path'

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

function createTimestamp() {
	const now = new Date()
	const yyyy = now.getFullYear()
	const mm = String(now.getMonth() + 1).padStart(2, '0')
	const dd = String(now.getDate()).padStart(2, '0')
	const hh = String(now.getHours()).padStart(2, '0')
	const mi = String(now.getMinutes()).padStart(2, '0')
	const ss = String(now.getSeconds()).padStart(2, '0')
	return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

async function ensureLogsFolder(log: (line: string) => void): Promise<number | null> {
	try {
		const byPath = await strapi.db.query('plugin::upload.folder').findOne({
			where: { path: '/logs' },
			select: ['id', 'path', 'name', 'pathId'],
		})
		if (byPath?.id) {
			log(`Upload-Ordner gefunden (path=/logs): id=${byPath.id}, pathId=${byPath.pathId}`)
			return byPath.id
		}

		const byName = await strapi.db.query('plugin::upload.folder').findOne({
			where: { name: 'logs', parent: null },
			select: ['id', 'path', 'name', 'pathId'],
		})
		if (byName?.id) {
			log(`Upload-Ordner gefunden (name=logs): id=${byName.id}, path=${byName.path}`)
			return byName.id
		}

		const highestPathId = await strapi.db.query('plugin::upload.folder').findOne({
			select: ['pathId'],
			orderBy: { pathId: 'desc' },
		})
		const nextPathId = (highestPathId?.pathId ?? 0) + 1

		const created = await strapi.db.query('plugin::upload.folder').create({
			data: {
				name: 'logs',
				path: '/logs',
				pathId: nextPathId,
				parent: null,
			},
			select: ['id', 'path', 'name', 'pathId'],
		})

		log(`Upload-Ordner erstellt: id=${created?.id}, path=/logs, pathId=${nextPathId}`)
		return created?.id ?? null
	} catch (err: any) {
		log(`Upload-Ordner konnte nicht sichergestellt werden: ${err?.message || 'unbekannter Fehler'}`)
		return null
	}
}

const controller = () => ({
	async importCsv(ctx: any) {
		const startedAt = new Date()
		const timestamp = createTimestamp()
		const logFileName = `import-chromosoft-users-${timestamp}.log`
		const logLines: string[] = []
		const log = (line: string) => {
			const at = new Date().toISOString()
			logLines.push(`[${at}] ${line}`)
		}

		let csvContent = ''

		const file = (ctx.request as any)?.files?.file
		if (file?.filepath) {
			csvContent = await fs.readFile(file.filepath, 'utf8')
			log(`CSV aus Upload-Datei gelesen: ${file.originalFilename || file.name || 'unbekannt'}`)
		} else if (typeof ctx.request?.body === 'string') {
			csvContent = ctx.request.body
			log('CSV aus raw request body gelesen')
		} else if (typeof ctx.request?.body?.csv === 'string') {
			csvContent = ctx.request.body.csv
			log('CSV aus JSON-Feld "csv" gelesen')
		} else {
			csvContent = await readRawStream(ctx.req)
			log('CSV aus Stream gelesen')
		}

		if (!csvContent || csvContent.trim() === '') {
			log('Abbruch: CSV payload fehlt oder ist leer')
			return ctx.badRequest('CSV payload fehlt oder ist leer')
		}

		const rows = parseCsv(csvContent)
		const chromosoftUsers = rows
			.map(mapRowToChromosoftUser)
			.filter((row): row is ChromosoftUser => row !== null)
		log(`CSV geparst: ${rows.length} Zeilen, ${chromosoftUsers.length} importierbare Datensätze`)

		if (chromosoftUsers.length === 0) {
			log('Abbruch: Keine importierbaren Datensätze in CSV gefunden')
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
			log(`Starte Verarbeitung für cId=${cu.cId}, email=${cu.email ?? 'null'}`)

			const wu1 = await strapi.db
				.query('plugin::users-permissions.user')
				.findOne({
					where: { cId: cu.cId },
					select: ['id', 'cId', 'documentId', 'email'],
				})
			log(`wu1 per cId gefunden: ${wu1 ? `id=${wu1.id}` : 'nein'}`)

			if (cu.email) {
				const wu2List = await strapi.db
					.query('plugin::users-permissions.user')
					.findMany({
						where: { email: cu.email },
						select: ['id', 'cId', 'documentId', 'email'],
					})
				log(`wu2List per email gefunden: ${wu2List.length}`)

				for (const duplicateUser of wu2List) {
					if (wu1 && duplicateUser.id === wu1.id) {
						log(`Email rewrite übersprungen für id=${duplicateUser.id} (ist wu1)`)
						continue
					}

					const rewritten = generateStrapiMail(duplicateUser.cId || duplicateUser.id)
					if (duplicateUser.email === rewritten) {
						log(`Email rewrite übersprungen für id=${duplicateUser.id} (bereits ${rewritten})`)
						continue
					}

					await strapi.db.query('plugin::users-permissions.user').update({
						where: { id: duplicateUser.id },
						data: { email: rewritten },
					})
					log(`Email rewrite: user id=${duplicateUser.id} -> ${rewritten}`)

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
			log(`User upsert payload cId=${cu.cId}: ${JSON.stringify(userData)}`)

			let persistedUser = wu1
			if (wu1) {
				await strapi.db.query('plugin::users-permissions.user').update({
					where: { id: wu1.id },
					data: userData,
				})
				log(`User aktualisiert: id=${wu1.id}, username=${username}, email=${targetEmail}`)
				stats.usersUpdated += 1
			} else {
				persistedUser = await strapi.db
					.query('plugin::users-permissions.user')
					.create({
						data: userData,
						select: ['id', 'cId', 'documentId', 'email'],
					})
				log(`User erstellt: id=${persistedUser?.id}, username=${username}, email=${targetEmail}`)
				stats.usersCreated += 1
			}

			if (cu.personIsBreeder) {
				log(`Breeder-Flag aktiv für cId=${cu.cId} -> Upsert breeder`)
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
				log(`Breeder upsert payload cId=${cu.cId}: ${JSON.stringify(breederData)}`)

				if (existingBreeder) {
					await strapi.db.query('plugin::hzd-plugin.breeder').update({
						where: { id: existingBreeder.id },
						data: breederData,
					})
					log(`Breeder aktualisiert: id=${existingBreeder.id}, cId=${cu.cId}`)
				} else {
					await strapi.db.query('plugin::hzd-plugin.breeder').create({
						data: breederData,
					})
					log(`Breeder erstellt: cId=${cu.cId}`)
				}

				stats.breedersUpserted += 1
			} else {
				log(`Breeder-Flag nicht aktiv für cId=${cu.cId}`)
			}
		}

		const finishedAt = new Date()
		log(
			`Import abgeschlossen. Dauer=${finishedAt.getTime() - startedAt.getTime()}ms, total=${stats.total}, created=${stats.usersCreated}, updated=${stats.usersUpdated}, breeders=${stats.breedersUpserted}, rewrites=${stats.emailsRewritten}`,
		)

		const tempLogPath = path.join(tmpdir(), logFileName)
		await fs.writeFile(tempLogPath, `${logLines.join('\n')}\n`, 'utf8')
		let uploadedLog: any = null
		let logUploadError: string | null = null

		try {
			const stat = await fs.stat(tempLogPath)
			const logsFolderId = await ensureLogsFolder(log)

			const uploadResult = await strapi
				.plugin('upload')
				.service('upload')
				.upload({
					data: {
						fileInfo: {
							name: logFileName,
							alternativeText: 'Chromosoft User Import Log',
							caption: `Chromosoft Import ${timestamp}`,
						},
						...(logsFolderId ? { folder: logsFolderId } : {}),
					},
					files: {
						filepath: tempLogPath,
						originalFilename: logFileName,
						mimetype: 'text/plain',
						size: stat.size,
					},
				})

			uploadedLog = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult
			if (uploadedLog?.id && logsFolderId) {
				await strapi.db.query('plugin::upload.file').update({
					where: { id: uploadedLog.id },
					data: {
						folder: logsFolderId,
						folderPath: '/logs',
					},
				})
				log(
					`Logdatei Ordner-Zuordnung erzwungen: fileId=${uploadedLog.id} -> folderId=${logsFolderId}, folderPath=/logs`,
				)
			}
			log(
				`Logdatei in Media hochgeladen: id=${uploadedLog?.id ?? 'n/a'}, url=${uploadedLog?.url ?? 'n/a'}`,
			)
		} catch (err: any) {
			logUploadError = err?.message || 'unbekannter Fehler'
			log(`Log-Upload fehlgeschlagen: ${logUploadError}`)
		} finally {
			await fs.unlink(tempLogPath).catch(() => null)
		}

		ctx.body = {
			success: true,
			stats,
			log: uploadedLog
				? {
						id: uploadedLog.id,
						name: uploadedLog.name,
						url: uploadedLog.url,
					}
				: null,
			logUploadError,
		}
	},
})

export default controller

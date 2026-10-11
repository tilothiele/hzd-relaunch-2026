import type { Core } from '@strapi/strapi'
import type { CsCsvColumn } from './cs-member-columns'

const HZD_SETTING_UID = 'api::hzd-setting.hzd-setting' as const
const DETAIL_LIMIT = 100
const PAGE_SIZE = 500

type ReportKind = 'dogs' | 'members'
type ChangeKind = 'new' | 'changed' | 'deleted'

interface FieldChange {
	header: string
	before: string | null
	after: string | null
}

interface RecordDiff {
	kind: ChangeKind
	identity: string
	label: string
	fields: FieldChange[]
}

const KIND_LABEL: Record<ChangeKind, string> = {
	new: 'Neu',
	changed: 'Geändert',
	deleted: 'Offenbar gelöscht',
}

const PROFILE: Record<ReportKind, {
	subjectName: string
	labelAttributes: string[]
}> = {
	dogs: {
		subjectName: 'Hunde',
		labelAttributes: ['FullName', 'GivenName'],
	},
	members: {
		subjectName: 'Mitglieder',
		labelAttributes: ['Firstname', 'Lastname'],
	},
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

function normalizeValue(value: unknown): string | null {
	if (value === null || value === undefined) {
		return null
	}
	const text = value instanceof Date
		? value.toISOString()
		: String(value).trim()
	return text === '' ? null : text
}

function displayValue(value: string | null): string {
	return value === null ? '–' : value
}

function readEmail(value: unknown): string | null {
	if (typeof value !== 'string') {
		return null
	}
	const email = value.trim()
	if (!email.includes('@')) {
		return null
	}
	return email
}

function compareIdentity(left: string, right: string): number {
	return left.localeCompare(right, 'de', { numeric: true })
}

function recordLabel(
	row: Record<string, unknown> | undefined,
	labelAttributes: string[],
	identity: string,
): string {
	const parts = labelAttributes
		.map((attribute) => normalizeValue(row?.[attribute]))
		.filter((value): value is string => value !== null)
	if (parts.length === 0) {
		return identity
	}
	return `${parts.join(' ')} (${identity})`
}

async function readReportEmail(strapi: Core.Strapi): Promise<string | null> {
	const published = await strapi.documents(HZD_SETTING_UID).findFirst({
		status: 'published',
		fields: ['ReportEmail'],
	})
	const publishedEmail = readEmail(published?.ReportEmail)
	if (publishedEmail) {
		return publishedEmail
	}

	const draft = await strapi.documents(HZD_SETTING_UID).findFirst({
		status: 'draft',
		fields: ['ReportEmail'],
	})
	return readEmail(draft?.ReportEmail)
}

async function loadGeneration(
	strapi: Core.Strapi,
	uid: string,
	generation: number,
	attributes: string[],
): Promise<Record<string, unknown>[]> {
	const rows: Record<string, unknown>[] = []
	let offset = 0
	for (;;) {
		const page = await strapi.db.query(uid).findMany({
			where: { Generation: generation },
			select: attributes,
			limit: PAGE_SIZE,
			offset,
		}) as Record<string, unknown>[]
		rows.push(...page)
		if (page.length < PAGE_SIZE) {
			return rows
		}
		offset += PAGE_SIZE
	}
}

function indexByIdentity(
	rows: Record<string, unknown>[],
	identityAttribute: string,
): Map<string, Record<string, unknown>> {
	const indexed = new Map<string, Record<string, unknown>>()
	for (const row of rows) {
		const identity = normalizeValue(row[identityAttribute])
		if (!identity) {
			continue
		}
		indexed.set(identity, row)
	}
	return indexed
}

function changedFields(
	columns: CsCsvColumn[],
	before: Record<string, unknown> | undefined,
	after: Record<string, unknown> | undefined,
	onlyDifferences: boolean,
): FieldChange[] {
	const fields: FieldChange[] = []
	for (const column of columns) {
		const previous = normalizeValue(before?.[column.attribute])
		const current = normalizeValue(after?.[column.attribute])
		if (onlyDifferences && previous === current) {
			continue
		}
		if (!onlyDifferences && previous === null && current === null) {
			continue
		}
		fields.push({
			header: column.header,
			before: previous,
			after: current,
		})
	}
	return fields
}

function collectDiffs(
	columns: CsCsvColumn[],
	labelAttributes: string[],
	previous: Map<string, Record<string, unknown>>,
	current: Map<string, Record<string, unknown>>,
): {
	details: RecordDiff[]
	counts: Record<ChangeKind, number>
	omitted: number
	unchanged: number
} {
	const counts: Record<ChangeKind, number> = {
		new: 0,
		changed: 0,
		deleted: 0,
	}
	const details: RecordDiff[] = []
	let omitted = 0
	let unchanged = 0

	const remember = (
		kind: ChangeKind,
		identity: string,
		row: Record<string, unknown> | undefined,
		fields: FieldChange[],
	) => {
		counts[kind] += 1
		if (details.length >= DETAIL_LIMIT) {
			omitted += 1
			return
		}
		details.push({
			kind,
			identity,
			label: recordLabel(row, labelAttributes, identity),
			fields,
		})
	}

	const createdIds = [...current.keys()]
		.filter((identity) => !previous.has(identity))
		.sort(compareIdentity)
	for (const identity of createdIds) {
		const row = current.get(identity)
		const fields = details.length < DETAIL_LIMIT
			? changedFields(columns, undefined, row, false)
			: []
		remember('new', identity, row, fields)
	}

	const sharedIds = [...current.keys()]
		.filter((identity) => previous.has(identity))
		.sort(compareIdentity)
	for (const identity of sharedIds) {
		const before = previous.get(identity)
		const after = current.get(identity)
		const fields = changedFields(columns, before, after, true)
		if (fields.length === 0) {
			unchanged += 1
			continue
		}
		remember('changed', identity, after, fields)
	}

	const removedIds = [...previous.keys()]
		.filter((identity) => !current.has(identity))
		.sort(compareIdentity)
	for (const identity of removedIds) {
		const row = previous.get(identity)
		const fields = details.length < DETAIL_LIMIT
			? changedFields(columns, row, undefined, false)
			: []
		remember('deleted', identity, row, fields)
	}

	return { details, counts, omitted, unchanged }
}

function buildText(options: {
	subjectName: string
	generation: number
	previousGeneration: number
	imported: number
	skipped: number
	unchanged: number
	counts: Record<ChangeKind, number>
	omitted: number
	details: RecordDiff[]
}): string {
	const lines = [
		`Chromosoft-Import ${options.subjectName}`,
		'',
		`Generation: ${options.generation}`,
		`Vorgängergeneration: ${options.previousGeneration > 0 ? options.previousGeneration : 'keine'}`,
		`Importierte Datensätze: ${options.imported}`,
		`Übersprungene Zeilen: ${options.skipped}`,
		`Unverändert: ${options.unchanged}`,
		`Neu: ${options.counts.new}`,
		`Geändert: ${options.counts.changed}`,
		`Offenbar gelöscht: ${options.counts.deleted}`,
		'',
	]

	const totalChanges = options.counts.new
		+ options.counts.changed
		+ options.counts.deleted
	if (totalChanges === 0) {
		lines.push('Gegenüber der Vorgängergeneration hat sich nichts geändert.')
		return lines.join('\n')
	}

	if (options.omitted > 0) {
		lines.push(
			`${options.details.length} von ${totalChanges} betroffenen Datensätzen im Detail. Weitere ${options.omitted} sind nicht einzeln aufgeführt.`,
			'',
		)
	}

	for (const diff of options.details) {
		lines.push(`${KIND_LABEL[diff.kind]}: ${diff.label}`)
		for (const field of diff.fields) {
			if (diff.kind === 'changed') {
				lines.push(
					`  ${field.header}: ${displayValue(field.before)} → ${displayValue(field.after)}`,
				)
			} else if (diff.kind === 'deleted') {
				lines.push(`  ${field.header}: ${displayValue(field.before)}`)
			} else {
				lines.push(`  ${field.header}: ${displayValue(field.after)}`)
			}
		}
		lines.push('')
	}

	return lines.join('\n')
}

function buildHtml(textOptions: Parameters<typeof buildText>[0]): string {
	const summaryRows = [
		['Generation', String(textOptions.generation)],
		[
			'Vorgängergeneration',
			textOptions.previousGeneration > 0
				? String(textOptions.previousGeneration)
				: 'keine',
		],
		['Importierte Datensätze', String(textOptions.imported)],
		['Übersprungene Zeilen', String(textOptions.skipped)],
		['Unverändert', String(textOptions.unchanged)],
		['Neu', String(textOptions.counts.new)],
		['Geändert', String(textOptions.counts.changed)],
		['Offenbar gelöscht', String(textOptions.counts.deleted)],
	].map(([label, value]) => (
		`<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
	)).join('')

	const totalChanges = textOptions.counts.new
		+ textOptions.counts.changed
		+ textOptions.counts.deleted
	const notice = totalChanges === 0
		? '<p>Gegenüber der Vorgängergeneration hat sich nichts geändert.</p>'
		: textOptions.omitted > 0
			? `<p>${textOptions.details.length} von ${totalChanges} betroffenen Datensätzen im Detail. Weitere ${textOptions.omitted} sind nicht einzeln aufgeführt.</p>`
			: ''

	const blocks = textOptions.details.map((diff) => {
		const rows = diff.fields.map((field) => {
			if (diff.kind === 'changed') {
				return `<tr><th>${escapeHtml(field.header)}</th><td>${escapeHtml(displayValue(field.before))}</td><td>${escapeHtml(displayValue(field.after))}</td></tr>`
			}
			const value = diff.kind === 'deleted' ? field.before : field.after
			return `<tr><th>${escapeHtml(field.header)}</th><td colspan="2">${escapeHtml(displayValue(value))}</td></tr>`
		}).join('')
		const head = diff.kind === 'changed'
			? '<tr><th>Feld</th><th>Vorher</th><th>Nachher</th></tr>'
			: ''
		return `<h3>${escapeHtml(KIND_LABEL[diff.kind])}: ${escapeHtml(diff.label)}</h3><table>${head}${rows}</table>`
	}).join('')

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body { font-family: Arial, sans-serif; line-height: 1.45; color: #333; }
.container { max-width: 860px; margin: 0 auto; padding: 20px; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 20px; font-size: 14px; }
th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
th { background: #f6f6f6; width: 34%; }
h2, h3 { margin-bottom: 8px; }
</style>
</head>
<body>
<div class="container">
<h2>Chromosoft-Import ${escapeHtml(textOptions.subjectName)}</h2>
<table><tbody>${summaryRows}</tbody></table>
${notice}
${blocks}
</div>
</body>
</html>`
}

export async function sendCsImportReport(
	strapi: Core.Strapi,
	options: {
		uid: string
		columns: CsCsvColumn[]
		identityAttribute: string
		generationField: 'ImportGenerationCSMembers' | 'ImportGenerationCSDogs'
		generation: number
		imported: number
		skipped: number
	},
): Promise<void> {
	const recipient = await readReportEmail(strapi)
	if (!recipient) {
		strapi.log.info(
			`CSV-Import Generation ${options.generation}: keine ReportEmail, Bericht wird nicht gesendet.`,
		)
		return
	}

	const kind: ReportKind = options.generationField === 'ImportGenerationCSDogs'
		? 'dogs'
		: 'members'
	const profile = PROFILE[kind]
	const attributes = [...new Set(options.columns.map((column) => column.attribute))]
	const previousGeneration = options.generation - 1
	const [previousRows, currentRows] = await Promise.all([
		previousGeneration > 0
			? loadGeneration(strapi, options.uid, previousGeneration, attributes)
			: Promise.resolve([]),
		loadGeneration(strapi, options.uid, options.generation, attributes),
	])
	const previous = indexByIdentity(previousRows, options.identityAttribute)
	const current = indexByIdentity(currentRows, options.identityAttribute)
	const { details, counts, omitted, unchanged } = collectDiffs(
		options.columns,
		profile.labelAttributes,
		previous,
		current,
	)

	const report = {
		subjectName: profile.subjectName,
		generation: options.generation,
		previousGeneration,
		imported: options.imported,
		skipped: options.skipped,
		unchanged,
		counts,
		omitted,
		details,
	}
	const totalChanges = counts.new + counts.changed + counts.deleted
	const subject = totalChanges === 0
		? `Chromosoft-Import ${profile.subjectName}: keine Änderungen (Generation ${options.generation})`
		: `Chromosoft-Import ${profile.subjectName}: ${counts.new} neu, ${counts.changed} geändert, ${counts.deleted} gelöscht (Generation ${options.generation})`

	await strapi.plugin('email').service('email').send({
		to: recipient,
		subject,
		text: buildText(report),
		html: buildHtml(report),
	})
	strapi.log.info(
		`CSV-Import Generation ${options.generation}: Bericht an ${recipient} gesendet (${totalChanges} Änderungen).`,
	)
}

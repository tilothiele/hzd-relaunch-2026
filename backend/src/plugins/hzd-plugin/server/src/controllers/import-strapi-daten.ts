import { createReadStream, promises as fs } from 'fs'
import type { Core } from '@strapi/strapi'

interface ImportSteps {
	members?: boolean
	dogs?: boolean
	breeders?: boolean
	studDogs?: boolean
}

interface ImportService {
	startImport: (options?: {
		onlyChanged?: boolean
		copyMemberEmails?: boolean
		steps?: ImportSteps
	}) => {
		started: boolean
		reason?: 'running' | 'no-steps' | null
		status: {
			phase: string
			logFileName: string | null
			error: string | null
		}
	}
	abortImport: () => { aborted: boolean; status: unknown }
	getStatus: () => Promise<unknown>
	getDownloadableLog: () => { filePath: string; fileName: string } | null
}

function readSteps(value: unknown): ImportSteps {
	const steps: ImportSteps = {}
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return steps
	}
	const source = value as Record<string, unknown>
	const keys = ['members', 'dogs', 'breeders', 'studDogs'] as const
	for (const key of keys) {
		if (typeof source[key] === 'boolean') {
			steps[key] = source[key]
		}
	}
	return steps
}

function getService(strapi: Core.Strapi): ImportService {
	return strapi.plugin('hzd-plugin').service('import-strapi-daten')
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
	async import_strapi_daten(ctx: {
		status: number
		body: unknown
		request: { body?: unknown }
	}) {
		const body = ctx.request.body
		const payload = body && typeof body === 'object' && !Array.isArray(body)
			? body as {
				onlyChanged?: unknown
				copyMemberEmails?: unknown
				steps?: unknown
			}
			: {}
		const onlyChanged = payload.onlyChanged === true
		const copyMemberEmails = payload.copyMemberEmails === true
		const steps = readSteps(payload.steps)
		const result = getService(strapi).startImport({
			onlyChanged,
			copyMemberEmails,
			steps,
		})
		if (result.started) {
			ctx.status = 202
		} else if (result.reason === 'no-steps') {
			ctx.status = 400
			ctx.body = {
				error: { message: 'Mindestens ein Schritt muss ausgewählt sein.' },
			}
			return
		} else {
			ctx.status = 409
		}
		ctx.body = await getService(strapi).getStatus()
	},

	async abort(ctx: { status: number; body: unknown }) {
		const result = getService(strapi).abortImport()
		ctx.status = 200
		ctx.body = {
			aborted: result.aborted,
			status: result.status,
		}
	},

	async status(ctx: { body: unknown }) {
		ctx.body = await getService(strapi).getStatus()
	},

	async downloadLog(ctx: {
		status: number
		body: unknown
		set: (field: string, value: string) => void
	}) {
		const file = getService(strapi).getDownloadableLog()
		if (!file) {
			ctx.status = 404
			ctx.body = {
				error: { message: 'Keine Logdatei vorhanden.' },
			}
			return
		}

		try {
			await fs.access(file.filePath)
		} catch {
			ctx.status = 404
			ctx.body = {
				error: { message: 'Logdatei wurde nicht gefunden.' },
			}
			return
		}

		ctx.set('Content-Type', 'text/plain; charset=utf-8')
		ctx.set(
			'Content-Disposition',
			`attachment; filename="${file.fileName}"`,
		)
		ctx.body = createReadStream(file.filePath)
	},
})

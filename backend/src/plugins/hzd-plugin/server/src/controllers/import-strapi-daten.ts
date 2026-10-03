import { createReadStream, promises as fs } from 'fs'
import type { Core } from '@strapi/strapi'

interface ImportService {
	startImport: (options?: { onlyChanged?: boolean }) => {
		started: boolean
		status: {
			phase: string
			logFileName: string | null
			error: string | null
		}
	}
	getStatus: () => unknown
	getDownloadableLog: () => { filePath: string; fileName: string } | null
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
		const onlyChanged = !!body
			&& typeof body === 'object'
			&& !Array.isArray(body)
			&& (body as { onlyChanged?: unknown }).onlyChanged === true
		const result = getService(strapi).startImport({ onlyChanged })
		ctx.status = result.started ? 202 : 409
		ctx.body = result.status
	},

	async status(ctx: { body: unknown }) {
		ctx.body = getService(strapi).getStatus()
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

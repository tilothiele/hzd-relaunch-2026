/**
 * cs-dog controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { CS_DOG_COLUMNS } from '../../../utils/cs-dog-columns'
import { CsCsvUploadError, importCsCsv } from '../../../utils/cs-csv-upload'

const CS_DOG_UID = 'api::cs-dog.cs-dog'

export default factories.createCoreController(
	CS_DOG_UID,
	({ strapi }: { strapi: Core.Strapi }) => ({
		async upload(ctx) {
			try {
				const result = await importCsCsv(strapi, {
					uid: CS_DOG_UID,
					files: ctx.request.files,
					fieldName: 'dogs.csv',
					columns: CS_DOG_COLUMNS,
					identityAttribute: 'IdAnimal',
					generationField: 'ImportGenerationCSDogs',
				})
				ctx.body = { data: result }
			} catch (error) {
				if (error instanceof CsCsvUploadError) {
					return ctx.badRequest(error.message)
				}
				const message = error instanceof Error
					? error.message
					: 'Import fehlgeschlagen.'
				strapi.log.error(`upload-cs-dogs fehlgeschlagen: ${message}`)
				return ctx.internalServerError('Import fehlgeschlagen.')
			}
		},
	}),
)

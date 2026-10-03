/**
 * cs-member controller
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'
import { CS_MEMBER_COLUMNS } from '../../../utils/cs-member-columns'
import { CsCsvUploadError, importCsCsv } from '../../../utils/cs-csv-upload'

const CS_MEMBER_UID = 'api::cs-member.cs-member'

export default factories.createCoreController(
	CS_MEMBER_UID,
	({ strapi }: { strapi: Core.Strapi }) => ({
		async upload(ctx) {
			try {
				const result = await importCsCsv(strapi, {
					uid: CS_MEMBER_UID,
					files: ctx.request.files,
					fieldName: 'members.csv',
					columns: CS_MEMBER_COLUMNS,
					identityAttribute: 'IdPerson',
					generationField: 'ImportGenerationCSMembers',
				})
				ctx.body = { data: result }
			} catch (error) {
				if (error instanceof CsCsvUploadError) {
					return ctx.badRequest(error.message)
				}
				const message = error instanceof Error
					? error.message
					: 'Import fehlgeschlagen.'
				strapi.log.error(`upload-cs-member fehlgeschlagen: ${message}`)
				return ctx.internalServerError('Import fehlgeschlagen.')
			}
		},
	}),
)

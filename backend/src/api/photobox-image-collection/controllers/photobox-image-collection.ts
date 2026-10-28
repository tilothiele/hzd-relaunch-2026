/**
 * photobox-image-collection controller
 *
 * Mitglieder sehen nur Collections, deren Fotograf sie selbst sind.
 * Der Filter wird nach der Query-Sanitizer-Stufe gesetzt, damit er
 * nicht als gesperrte User-Relation entfernt wird.
 * API-Token und Admin bleiben ungefiltert (TIK).
 */

import { factories } from '@strapi/strapi'
import type { Core } from '@strapi/strapi'

const UID = 'api::photobox-image-collection.photobox-image-collection' as const

interface RequestContext {
	params?: { id?: string }
	query?: Record<string, unknown>
	state?: {
		auth?: { strategy?: { name?: string } }
		user?: { documentId?: unknown; id?: unknown }
	}
	notFound?: (message?: string) => unknown
}

interface CollectionController {
	validateQuery(ctx: RequestContext): Promise<void>
	sanitizeQuery(ctx: RequestContext): Promise<Record<string, unknown>>
	sanitizeOutput(data: unknown, ctx: RequestContext): Promise<unknown>
	transformResponse(
		data: unknown,
		meta?: Record<string, unknown>,
	): unknown
	find(ctx: RequestContext): Promise<unknown>
	findOne(ctx: RequestContext): Promise<unknown>
}

function isPrivilegedRequest(ctx: RequestContext): boolean {
	const strategy = ctx.state?.auth?.strategy?.name
	return strategy === 'api-token' || strategy === 'admin'
}

function ownerFilter(ctx: RequestContext): Record<string, unknown> {
	const user = ctx.state?.user
	const documentId = user?.documentId
	if (typeof documentId === 'string' && documentId.trim().length > 0) {
		return {
			photogapher: {
				documentId: { $eq: documentId.trim() },
			},
		}
	}

	const userId = user?.id
	if (typeof userId === 'number' || typeof userId === 'string') {
		return {
			photogapher: {
				id: { $eq: userId },
			},
		}
	}

	return { documentId: { $eq: '__none__' } }
}

function mergeOwnerFilter(
	existing: unknown,
	owner: Record<string, unknown>,
): Record<string, unknown> {
	const hasExisting = Boolean(
		existing
		&& typeof existing === 'object'
		&& !Array.isArray(existing)
		&& Object.keys(existing as object).length > 0,
	)
	if (!hasExisting) {
		return owner
	}
	return { $and: [existing, owner] }
}

function asController(value: object): CollectionController {
	return value as CollectionController
}

async function findOwned(
	controller: CollectionController,
	ctx: RequestContext,
	app: Core.Strapi,
) {
	await controller.validateQuery(ctx)
	const sanitizedQuery = await controller.sanitizeQuery(ctx)
	const scopedQuery = {
		...sanitizedQuery,
		filters: mergeOwnerFilter(
			sanitizedQuery.filters,
			ownerFilter(ctx),
		),
	}
	const service = app.service(UID) as {
		find: (params: Record<string, unknown>) => Promise<{
			results: unknown
			pagination: unknown
		}>
	}
	const { results, pagination } = await service.find(scopedQuery)
	const sanitizedResults = await controller.sanitizeOutput(results, ctx)
	return controller.transformResponse(sanitizedResults, {
		pagination: pagination as Record<string, unknown>,
	})
}

export default factories.createCoreController(
	UID,
	({ strapi }: { strapi: Core.Strapi }) => ({
		async find(ctx) {
			const request = ctx as RequestContext
			const controller = asController(this)
			if (isPrivilegedRequest(request)) {
				const proto = Object.getPrototypeOf(
					controller,
				) as CollectionController
				return proto.find.call(controller, request)
			}
			return findOwned(controller, request, strapi)
		},

		async findOne(ctx) {
			const request = ctx as RequestContext
			const controller = asController(this)
			if (isPrivilegedRequest(request)) {
				const proto = Object.getPrototypeOf(
					controller,
				) as CollectionController
				return proto.findOne.call(controller, request)
			}

			const documentId = request.params?.id
			if (!documentId) {
				return request.notFound?.()
			}

			await controller.validateQuery(request)
			const sanitizedQuery = await controller.sanitizeQuery(request)
			const service = strapi.service(UID) as {
				findOne: (
					id: string,
					params: Record<string, unknown>,
				) => Promise<unknown>
			}
			const entity = await service.findOne(documentId, {
				...sanitizedQuery,
				filters: mergeOwnerFilter(
					sanitizedQuery.filters,
					ownerFilter(request),
				),
			})
			const sanitizedEntity = await controller.sanitizeOutput(
				entity,
				request,
			)
			return controller.transformResponse(sanitizedEntity)
		},
	}),
)

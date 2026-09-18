/**
 * passed-dog controller
 *
 * Öffentliche REST-Liste nur Einträge mit Consent.
 * HealthInfo bleibt intern und wird öffentlich nicht ausgeliefert.
 */

import { factories } from '@strapi/strapi'

function isPrivilegedRequest(ctx: {
	get?: (name: string) => string
	request?: { header?: { authorization?: string } }
	state?: {
		auth?: { strategy?: { name?: string } }
		user?: { isSuperAdmin?: boolean }
	}
}): boolean {
	const strategy = ctx.state?.auth?.strategy?.name
	if (strategy === 'api-token' || strategy === 'admin') {
		return true
	}
	if (ctx.state?.user?.isSuperAdmin === true) {
		return true
	}
	const authorization = ctx.get?.('authorization')
		?? ctx.request?.header?.authorization
		?? ''
	return authorization.toLowerCase().startsWith('bearer ')
}

function restrictToPublicListing(ctx: { query?: Record<string, unknown> }) {
	const query = ctx.query ?? {}
	const existingFilters = query.filters
	const listingFilter = { Consent: { $eq: true } }
	const hasExisting = Boolean(
		existingFilters
		&& typeof existingFilters === 'object'
		&& Object.keys(existingFilters as object).length > 0,
	)
	ctx.query = {
		...query,
		filters: hasExisting
			? { $and: [existingFilters, listingFilter] }
			: listingFilter,
	}
}

function omitInternalFields(payload: unknown): unknown {
	const strip = (item: unknown): unknown => {
		if (!item || typeof item !== 'object' || Array.isArray(item)) {
			return item
		}
		const record = { ...(item as Record<string, unknown>) }
		delete record.HealthInfo
		delete record.ClientIP
		delete record.EMail
		return record
	}

	if (!payload || typeof payload !== 'object') {
		return payload
	}
	const body = payload as { data?: unknown }
	if (Array.isArray(body.data)) {
		return { ...body, data: body.data.map(strip) }
	}
	if (body.data && typeof body.data === 'object') {
		return { ...body, data: strip(body.data) }
	}
	return payload
}

export default factories.createCoreController(
	'api::passed-dog.passed-dog',
	() => ({
		async find(ctx) {
			if (!isPrivilegedRequest(ctx)) {
				restrictToPublicListing(ctx)
			}
			const result = await super.find(ctx)
			if (!isPrivilegedRequest(ctx)) {
				return omitInternalFields(result)
			}
			return result
		},

		async findOne(ctx) {
			if (!isPrivilegedRequest(ctx)) {
				restrictToPublicListing(ctx)
			}
			const result = await super.findOne(ctx)
			if (!isPrivilegedRequest(ctx)) {
				return omitInternalFields(result)
			}
			return result
		},
	}),
)

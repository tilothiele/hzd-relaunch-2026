/**
 * Litter Lifecycle-Hooks
 *
 * DisplayName muss immer lauten: "<breeder.kennelName> - <OrderLetter>-Wurf"
 * (z. B. "vom Schmollensee - B-Wurf").
 *
 * Wird bei insert (beforeCreate) und update (beforeUpdate) gesetzt,
 * auch wenn nur ein Teil der Felder aktualisiert wird.
 */

const LITTER_UID = 'plugin::hzd-plugin.litter'
const BREEDER_UID = 'plugin::hzd-plugin.breeder'
const DEFAULT_MAX_LENGTH = 255

function getDisplayNameMaxLength(): number {
	const model = strapi.getModel(LITTER_UID) as {
		attributes?: { DisplayName?: { type?: string; maxLength?: number } }
	} | null

	const attribute = model?.attributes?.DisplayName
	if (
		attribute
		&& attribute.type === 'string'
		&& typeof attribute.maxLength === 'number'
		&& attribute.maxLength > 0
	) {
		return attribute.maxLength
	}

	return DEFAULT_MAX_LENGTH
}

function truncateToMaxLength(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value
	}
	return value.slice(0, maxLength)
}

function normalizeOrderLetter(value: unknown): string {
	if (typeof value !== 'string') {
		return ''
	}
	const cleaned = value.trim().replace(/[^A-Za-z]/g, '')
	return cleaned.charAt(0).toUpperCase()
}

function buildLitterDisplayName(kennelName: string, orderLetter: string): string {
	if (kennelName) {
		return `${kennelName} - ${orderLetter}-Wurf`
	}
	return `${orderLetter}-Wurf`
}

async function getBreederKennelName(ref: { id?: number; documentId?: string }): Promise<string | null> {
	const where: Record<string, unknown> = {}
	if (ref.id != null) {
		where.id = ref.id
	}
	if (ref.documentId) {
		where.documentId = ref.documentId
	}
	if (Object.keys(where).length === 0) {
		return null
	}

	try {
		const breeder = await strapi.db.query(BREEDER_UID).findOne({
			where,
			select: ['kennelName'],
		}) as { kennelName?: string | null } | null

		if (typeof breeder?.kennelName === 'string' && breeder.kennelName.trim()) {
			return breeder.kennelName.trim()
		}
	} catch {
		return null
	}

	return null
}

async function resolveKennelNameFromRelation(relation: unknown): Promise<string | null> {
	if (relation == null) {
		return null
	}

	if (typeof relation === 'number') {
		return getBreederKennelName({ id: relation })
	}

	if (typeof relation === 'string') {
		const value = relation.trim()
		if (!value) {
			return null
		}
		if (/^[0-9]+$/.test(value)) {
			const byId = await getBreederKennelName({ id: Number(value) })
			if (byId) {
				return byId
			}
		}
		return getBreederKennelName({ documentId: value })
	}

	// Document Service formt manyToOne vor dem Hook um, z. B.
	// { set: [{ id: 12 }] } oder { connect: [{ id: 12 }] }.
	if (Array.isArray(relation)) {
		for (let index = relation.length - 1; index >= 0; index -= 1) {
			const name = await resolveKennelNameFromRelation(relation[index])
			if (name) {
				return name
			}
		}
		return null
	}

	if (typeof relation === 'object') {
		const rel = relation as Record<string, unknown>

		if (rel.set !== undefined && rel.set !== null) {
			const bySet = await resolveKennelNameFromRelation(rel.set)
			if (bySet) {
				return bySet
			}
		}
		if (rel.connect !== undefined && rel.connect !== null) {
			const byConnect = await resolveKennelNameFromRelation(rel.connect)
			if (byConnect) {
				return byConnect
			}
		}

		if (typeof rel.id === 'number') {
			return getBreederKennelName({ id: rel.id })
		}
		if (typeof rel.id === 'string' && /^[0-9]+$/.test(rel.id.trim())) {
			return getBreederKennelName({ id: Number(rel.id.trim()) })
		}
		if (typeof rel.documentId === 'string') {
			return getBreederKennelName({ documentId: rel.documentId })
		}
	}

	return null
}

async function resolveExistingLitterDocumentId(
	where: Record<string, unknown> | undefined,
): Promise<string | undefined> {
	if (!where) {
		return undefined
	}

	if (typeof where.documentId === 'string') {
		return where.documentId
	}

	const rawId = where.id
	const id = typeof rawId === 'number'
		? rawId
		: typeof rawId === 'string' && /^[0-9]+$/.test(rawId)
			? Number(rawId)
			: undefined

	if (id != null) {
		try {
			const litter = await strapi.db.query(LITTER_UID).findOne({
				where: { id },
				select: ['documentId'],
			}) as { documentId?: string | null } | null
			return typeof litter?.documentId === 'string' ? litter.documentId : undefined
		} catch {
			return undefined
		}
	}

	return undefined
}

async function syncLitterDisplayName(
	data: Record<string, unknown>,
	existingLitterDocumentId?: string,
): Promise<void> {
	let orderLetter = normalizeOrderLetter(data.OrderLetter)
	let kennelName = await resolveKennelNameFromRelation(data.breeder)

	// Partial Update: fehlende Werte aus dem bestehenden Datensatz ergänzen
	if ((!orderLetter || !kennelName) && existingLitterDocumentId) {
		try {
			const existing = await strapi.documents(LITTER_UID).findOne({
				documentId: existingLitterDocumentId,
				populate: {
					breeder: { fields: ['kennelName'] },
				},
			}) as {
				OrderLetter?: string | null
				breeder?: { kennelName?: string | null } | null
			} | null

			if (!orderLetter) {
				orderLetter = normalizeOrderLetter(existing?.OrderLetter)
			}
			if (!kennelName && typeof existing?.breeder?.kennelName === 'string' && existing.breeder.kennelName.trim()) {
				kennelName = existing.breeder.kennelName.trim()
			}
		} catch {
			// Best effort: ohne Bestandsdaten kann DisplayName nicht berechnet werden
		}
	}

	if (!orderLetter) {
		return
	}

	data.DisplayName = truncateToMaxLength(
		buildLitterDisplayName(kennelName ?? '', orderLetter),
		getDisplayNameMaxLength(),
	)
}

export default {
	async beforeCreate(event) {
		//console.log('HZD-PLUGIN: litter.beforeCreate triggered', event.params)
		const { data } = event.params
		await syncLitterDisplayName(data)
	},

	async beforeUpdate(event) {
		//console.log('HZD-PLUGIN: litter.beforeUpdate triggered', event.params)
		const { data, where } = event.params
		const existingLitterDocumentId = await resolveExistingLitterDocumentId(where)
		await syncLitterDisplayName(data, existingLitterDocumentId)
	},
}

const CHAMPION_UID = 'api::champion.champion'
const DOG_UID = 'plugin::hzd-plugin.dog'
const DEFAULT_STRING_MAX_LENGTH = 255

function getDisplayNameMaxLength(): number {
	const model = strapi.getModel(CHAMPION_UID)
	const attribute = model?.attributes?.DisplayName

	if (
		attribute
		&& attribute.type === 'string'
		&& typeof attribute.maxLength === 'number'
		&& attribute.maxLength > 0
	) {
		return attribute.maxLength
	}

	return DEFAULT_STRING_MAX_LENGTH
}

function truncateToMaxLength(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value
	}

	return value.slice(0, maxLength)
}

function resolveRelationDocumentId(value: unknown): string | undefined {
	if (!value) {
		return undefined
	}

	if (typeof value === 'string') {
		return value.trim() || undefined
	}

	if (typeof value !== 'object' || value === null) {
		return undefined
	}

	const relation = value as Record<string, unknown>

	if (typeof relation.documentId === 'string') {
		return relation.documentId
	}

	if (Array.isArray(relation.connect) && relation.connect.length > 0) {
		const first = relation.connect[0]
		if (typeof first === 'string') {
			return first
		}
		if (first && typeof first === 'object') {
			const connected = first as Record<string, unknown>
			if (typeof connected.documentId === 'string') {
				return connected.documentId
			}
		}
	}

	if (typeof relation.set === 'string') {
		return relation.set
	}

	return undefined
}

function isDisconnectingRelation(value: unknown): boolean {
	if (!value || typeof value !== 'object') {
		return false
	}

	const relation = value as Record<string, unknown>
	return Array.isArray(relation.disconnect) && relation.disconnect.length > 0
		&& (!Array.isArray(relation.connect) || relation.connect.length === 0)
		&& relation.set === undefined
}

function buildChampionDisplayName(
	fullKennelName?: string | null,
	ownerDisplayName?: string | null,
): string {
	return [fullKennelName, ownerDisplayName]
		.map((part) => (typeof part === 'string' ? part.trim() : ''))
		.filter(Boolean)
		.join(' ')
}

async function resolveExistingChampionDocumentId(
	where: Record<string, unknown> | undefined,
): Promise<string | undefined> {
	if (!where) {
		return undefined
	}

	if (typeof where.documentId === 'string') {
		return where.documentId
	}

	if (typeof where.id !== 'number') {
		return undefined
	}

	const champion = await strapi.db.query(CHAMPION_UID).findOne({
		where: { id: where.id },
		select: ['documentId'],
	})

	return typeof champion?.documentId === 'string'
		? champion.documentId
		: undefined
}

async function syncChampionDisplayName(
	data: Record<string, unknown>,
	existingChampionDocumentId?: string,
): Promise<void> {
	if (isDisconnectingRelation(data.hzd_plugin_dog)) {
		data.DisplayName = ''
		return
	}

	let dogDocumentId = resolveRelationDocumentId(data.hzd_plugin_dog)

	if (!dogDocumentId && existingChampionDocumentId) {
		const champion = await strapi.documents(CHAMPION_UID).findOne({
			documentId: existingChampionDocumentId,
			populate: { hzd_plugin_dog: true },
		})
		const linkedDog = champion?.hzd_plugin_dog as { documentId?: string } | null
		dogDocumentId = linkedDog?.documentId
	}

	if (!dogDocumentId) {
		return
	}

	const dog = await strapi.documents(DOG_UID).findOne({
		documentId: dogDocumentId,
		populate: {
			owner: {
				fields: ['DisplayName'],
			},
		},
	}) as {
		fullKennelName?: string | null
		owner?: { DisplayName?: string | null } | null
	} | null

	if (!dog) {
		return
	}

	const displayName = buildChampionDisplayName(
		dog.fullKennelName,
		dog.owner?.DisplayName,
	)

	data.DisplayName = truncateToMaxLength(
		displayName,
		getDisplayNameMaxLength(),
	)
}

export default {
	async beforeCreate(event) {
		await syncChampionDisplayName(event.params.data)
	},

	async beforeUpdate(event) {
		const { data, where } = event.params
		const existingChampionDocumentId = await resolveExistingChampionDocumentId(
			where,
		)

		await syncChampionDisplayName(data, existingChampionDocumentId)
	},
}

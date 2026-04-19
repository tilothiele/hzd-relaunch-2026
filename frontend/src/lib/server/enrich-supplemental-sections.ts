import type {
	StartpageSection,
	SupplementalDocumentGroupSection,
	SupplementalDocument,
	SupplementalDocumentGroup,
} from '@/types'
import {
	GET_SUPPLEMENTAL_DOCUMENT_GROUP_WITH_DOCUMENTS,
	GET_SUPPLEMENTAL_DOCUMENTS_FOR_ONE_GROUP,
} from '@/lib/graphql/queries'
import { fetchGraphQLServer } from './graphql-client'

interface SupplementalDocumentGroupWithDocumentsResult {
	supplementalDocumentGroup?: {
		documentId?: string
		supplemental_documents?: SupplementalDocument[] | null
		supplemental_documents_connection?: { nodes: SupplementalDocument[] } | null
	} | null
}

interface SupplementalDocumentsOneGroupResult {
	supplementalDocuments?: SupplementalDocument[] | null
}

interface GroupRef {
	documentId?: string | null
	id?: string | number | null
}

function documentsFromGroupPayload(
	group: NonNullable<SupplementalDocumentGroupWithDocumentsResult['supplementalDocumentGroup']>,
): SupplementalDocument[] {
	const fromConn = group.supplemental_documents_connection?.nodes
	if (fromConn?.length) {
		return fromConn
	}
	const fromFlat = group.supplemental_documents
	return fromFlat?.length ? fromFlat : []
}

function extractGroupRef(
	raw: SupplementalDocumentGroup | string | number | null | undefined,
): GroupRef | null {
	if (raw === null || raw === undefined) {
		return null
	}
	if (typeof raw === 'string' || typeof raw === 'number') {
		return { documentId: String(raw) }
	}
	const o = raw as SupplementalDocumentGroup
	const docId = o.documentId
	const id = o.id
	if (
		(docId === undefined || docId === null || String(docId).trim() === '')
		&& (id === undefined || id === null || String(id).trim() === '')
	) {
		return null
	}
	return {
		documentId:
			docId !== undefined && docId !== null && String(docId).trim() !== ''
				? String(docId).trim()
				: null,
		id: id !== undefined && id !== null ? id : null,
	}
}

/** Eindeutiger Schlüssel pro geladener Gruppe (Merge mit Section) */
function stableKey(ref: GroupRef): string | null {
	if (ref.documentId) {
		return `d:${ref.documentId}`
	}
	if (ref.id !== undefined && ref.id !== null && String(ref.id).length > 0) {
		return `i:${String(ref.id)}`
	}
	return null
}

function collectUniqueGroupRefs(sections: StartpageSection[]): GroupRef[] {
	const seen = new Set<string>()
	const out: GroupRef[] = []
	for (const s of sections) {
		const g = (s as SupplementalDocumentGroupSection).supplemental_document_group
		const ref = extractGroupRef(g ?? undefined)
		const key = ref ? stableKey(ref) : null
		if (!ref || !key || seen.has(key)) {
			continue
		}
		seen.add(key)
		out.push(ref)
	}
	return out
}

function normalizeRestDownload(
	raw: unknown,
): SupplementalDocument['DownloadDocument'] {
	if (!raw) {
		return null
	}
	const list = Array.isArray(raw) ? raw : [raw]
	const files = list
		.map((f) => {
			const o = f as Record<string, unknown>
			const url = typeof o.url === 'string' ? o.url : ''
			if (!url) {
				return null
			}
			return {
				url,
				name: typeof o.name === 'string' ? o.name : undefined,
				ext: typeof o.ext === 'string' ? o.ext : undefined,
				mime: typeof o.mime === 'string' ? o.mime : undefined,
				size: typeof o.size === 'number' ? o.size : undefined,
			}
		})
		.filter(Boolean) as NonNullable<SupplementalDocument['DownloadDocument']>
	return files.length ? files : null
}

function normalizeRestDocument(
	entry: Record<string, unknown>,
): SupplementalDocument {
	const attrs = (entry.attributes as Record<string, unknown> | undefined) ?? entry
	const docId =
		(attrs.documentId as string | undefined)
		?? (entry.documentId as string | undefined)
	const DownloadDocument = normalizeRestDownload(
		attrs.DownloadDocument ?? entry.DownloadDocument,
	)
	return {
		documentId: docId,
		Name: (attrs.Name as string | null | undefined) ?? null,
		Description: (attrs.Description as SupplementalDocument['Description']) ?? null,
		ShortId: (attrs.ShortId as string | null | undefined) ?? null,
		SortOrd: typeof attrs.SortOrd === 'number' ? attrs.SortOrd : null,
		DownloadDocument,
		VisibilityStart: (attrs.VisibilityStart as string | null | undefined) ?? null,
		VisibilityEnd: (attrs.VisibilityEnd as string | null | undefined) ?? null,
	}
}

/**
 * Strapi-REST: liefert Dokumente oft zuverlässiger als GraphQL bei M:N / populate.
 */
async function fetchDocumentsViaRest(
	baseUrl: string,
	ref: GroupRef,
): Promise<SupplementalDocument[]> {
	const root = baseUrl.replace(/\/$/, '')
	const pathIds: string[] = []
	if (ref.documentId) {
		pathIds.push(encodeURIComponent(ref.documentId))
	}
	if (ref.id !== undefined && ref.id !== null) {
		const p = encodeURIComponent(String(ref.id))
		if (!pathIds.includes(p)) {
			pathIds.push(p)
		}
	}

	const populateQueries = [
		'populate[supplemental_documents][populate][0]=DownloadDocument',
		'populate[supplemental_documents][populate]=DownloadDocument',
		'populate[supplemental_documents]=*',
		'populate=*',
	]

	for (const pathId of pathIds) {
		for (const q of populateQueries) {
			const url = `${root}/api/supplemental-document-groups/${pathId}?${q}`
			try {
				const res = await fetch(url, { cache: 'no-store' })
				if (!res.ok) {
					continue
				}
				const json = (await res.json()) as {
					data?: Record<string, unknown> & {
						attributes?: Record<string, unknown>
					}
				}
				const data = json.data
				if (!data) {
					continue
				}
				const attrs = data.attributes ?? data
				let rawList = attrs.supplemental_documents as unknown
				if (
					rawList
					&& typeof rawList === 'object'
					&& 'data' in (rawList as object)
				) {
					rawList = (rawList as { data: unknown[] }).data
				}
				if (!Array.isArray(rawList) || rawList.length === 0) {
					continue
				}
				return rawList.map((item) =>
					normalizeRestDocument(item as Record<string, unknown>),
				)
			} catch (err) {
				console.error('REST supplemental-document-groups', url, err)
			}
		}
	}
	return []
}

async function loadDocumentsForGroupRef(
	baseUrl: string,
	ref: GroupRef,
): Promise<SupplementalDocument[]> {
	let docs: SupplementalDocument[] = []

	if (ref.documentId) {
		try {
			const data = await fetchGraphQLServer<SupplementalDocumentGroupWithDocumentsResult>(
				GET_SUPPLEMENTAL_DOCUMENT_GROUP_WITH_DOCUMENTS,
				{ baseUrl, variables: { documentId: ref.documentId } },
			)
			const g = data.supplementalDocumentGroup
			if (g) {
				docs = documentsFromGroupPayload(g)
			}
		} catch (err) {
			console.error('supplementalDocumentGroup', ref.documentId, err)
		}
		if (!docs.length) {
			try {
				const alt = await fetchGraphQLServer<SupplementalDocumentsOneGroupResult>(
					GET_SUPPLEMENTAL_DOCUMENTS_FOR_ONE_GROUP,
					{ baseUrl, variables: { groupId: ref.documentId } },
				)
				docs = alt.supplementalDocuments ?? []
			} catch (err) {
				console.error('supplementalDocuments(filters eq)', ref.documentId, err)
			}
		}
	}

	if (!docs.length) {
		docs = await fetchDocumentsViaRest(baseUrl, ref)
	}

	return docs
}

/**
 * Lädt Supplemental-Dokumente pro Gruppe (GraphQL + REST), weil eingebettete
 * Relationen in Dynamic Zones oft unvollständig sind.
 */
export async function enrichSectionsWithSupplementalDocuments(
	sections: StartpageSection[] | null | undefined,
	baseUrl: string,
): Promise<StartpageSection[]> {
	if (!sections?.length) {
		return sections ?? []
	}

	const refs = collectUniqueGroupRefs(sections)
	if (refs.length === 0) {
		return sections
	}

	const byStableKey = new Map<string, SupplementalDocument[]>()

	await Promise.all(
		refs.map(async (ref) => {
			const key = stableKey(ref)
			if (!key) {
				return
			}
			const docs = await loadDocumentsForGroupRef(baseUrl, ref)
			if (docs.length > 0) {
				byStableKey.set(key, docs)
			}
		}),
	)

	return sections.map((s) => {
		const orig = (s as SupplementalDocumentGroupSection).supplemental_document_group
		const ref = extractGroupRef(orig ?? undefined)
		const key = ref ? stableKey(ref) : null
		if (!key || !orig) {
			return s
		}
		const merged = byStableKey.get(key)
		if (!merged?.length) {
			return s
		}
		const next: SupplementalDocumentGroupSection = {
			...(s as SupplementalDocumentGroupSection),
			supplemental_document_group: {
				...orig,
				supplemental_documents: merged,
				supplemental_documents_connection: undefined,
			},
		}
		return next
	})
}

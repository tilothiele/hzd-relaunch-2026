import {
	fetchSupplementalDocumentGroup,
	fetchSupplementalDocumentsForGroup,
} from '@/lib/strapi/api'
import type {
	StartpageSection,
	SupplementalDocumentGroupSection,
	SupplementalDocument,
	SupplementalDocumentGroup,
} from '@/types'

interface GroupRef {
	documentId?: string | null
	id?: string | number | null
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

function documentsFromGroupPayload(
	group: Record<string, unknown>,
): SupplementalDocument[] {
	const fromConn = (group.supplemental_documents_connection as {
		nodes?: unknown[]
	} | undefined)?.nodes
	if (fromConn?.length) {
		return fromConn.map((item) =>
			normalizeRestDocument(item as Record<string, unknown>),
		)
	}

	const fromFlat = group.supplemental_documents
	if (!Array.isArray(fromFlat)) {
		return []
	}

	return fromFlat.map((item) =>
		normalizeRestDocument(item as Record<string, unknown>),
	)
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

async function loadDocumentsForGroupRef(
	baseUrl: string,
	ref: GroupRef,
): Promise<SupplementalDocument[]> {
	let docs: SupplementalDocument[] = []

	if (ref.documentId) {
		try {
			const group = await fetchSupplementalDocumentGroup(ref.documentId, baseUrl)
			if (group) {
				docs = documentsFromGroupPayload(group)
			}
		} catch (err) {
			console.error('supplementalDocumentGroup', ref.documentId, err)
		}
		if (!docs.length) {
			try {
				const alt = await fetchSupplementalDocumentsForGroup(
					ref.documentId,
					baseUrl,
				)
				docs = alt.map((item) => normalizeRestDocument(item))
			} catch (err) {
				console.error('supplementalDocuments(filters eq)', ref.documentId, err)
			}
		}
	}

	return docs
}

/**
 * Lädt Supplemental-Dokumente pro Gruppe (REST), weil eingebettete
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

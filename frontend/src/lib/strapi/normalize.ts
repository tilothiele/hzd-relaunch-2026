import type { StartpageSection } from '@/types'

export function blocksComponentToTypename(component: string): string {
	const raw = component.replace(/^blocks\./, '')
	const parts = raw.split('-').map((part) => (
		part.charAt(0).toUpperCase() + part.slice(1)
	))
	return `ComponentBlocks${parts.join('')}`
}

export function formComponentToTypename(component: string): string {
	const raw = component.replace(/^form\./, '')
	const parts = raw.split('-').map((part) => (
		part.charAt(0).toUpperCase() + part.slice(1)
	))
	return `ComponentForm${parts.join('')}`
}

export function normalizeDynamicZoneItem<T extends Record<string, unknown>>(
	item: T,
	mapper: (component: string) => string = blocksComponentToTypename,
): T & { __typename: string } {
	const component = typeof item.__component === 'string' ? item.__component : ''
	return {
		...item,
		__typename: component ? mapper(component) : (item.__typename as string),
	}
}

/** REST-Enums mit Leerzeichen → GraphQL-/Frontend-Schreibweise */
export function normalizeCardLayout(
	value: unknown,
): 'Full_Cover' | 'Bordered_Box' | null | undefined {
	if (value === null || value === undefined) {
		return null
	}

	if (typeof value !== 'string') {
		return null
	}

	const normalized = value.trim().toLowerCase().replace(/\s+/g, '_')
	if (normalized === 'bordered_box') {
		return 'Bordered_Box'
	}

	if (normalized === 'full_cover') {
		return 'Full_Cover'
	}

	if (value === 'Bordered_Box' || value === 'Full_Cover') {
		return value
	}

	return null
}

function normalizeBlockSection(
	section: Record<string, unknown>,
): Record<string, unknown> {
	const normalized = normalizeDynamicZoneItem(section, blocksComponentToTypename)

	if (normalized.__typename === 'ComponentBlocksCardSection') {
		return {
			...normalized,
			CardLayout: normalizeCardLayout(normalized.CardLayout),
		}
	}

	return normalized
}

export function normalizeSections(
	sections: unknown,
): StartpageSection[] {
	if (!Array.isArray(sections)) {
		return []
	}

	return sections.map((section) => normalizeBlockSection(
		section as Record<string, unknown>,
	)) as unknown as StartpageSection[]
}

export function normalizeFormFields(fields: unknown): Array<Record<string, unknown>> {
	if (!Array.isArray(fields)) {
		return []
	}

	return fields.map((field) => normalizeDynamicZoneItem(
		field as Record<string, unknown>,
		formComponentToTypename,
	))
}

export function normalizePage<T extends Record<string, unknown>>(page: T): T {
	if (Array.isArray(page.Sections)) {
		return {
			...page,
			Sections: normalizeSections(page.Sections),
		}
	}

	return page
}

interface StrapiPagination {
	page?: number
	pageSize?: number
	pageCount?: number
	total?: number
}

export function toConnectionResult<T>(options: {
	items: T[]
	pagination?: StrapiPagination
}): {
	nodes: T[]
	pageInfo: {
		page: number
		pageSize: number
		pageCount: number
		total: number
	}
} {
	const page = options.pagination?.page ?? 1
	const pageSize = options.pagination?.pageSize ?? options.items.length
	const pageCount = options.pagination?.pageCount ?? 1
	const total = options.pagination?.total ?? options.items.length

	return {
		nodes: options.items,
		pageInfo: {
			page,
			pageSize,
			pageCount,
			total,
		},
	}
}

export function extractStrapiList<T>(payload: unknown): T[] {
	if (!payload || typeof payload !== 'object') {
		return []
	}

	const record = payload as Record<string, unknown>

	if (Array.isArray(record.data)) {
		return record.data as T[]
	}

	if (Array.isArray(record.results)) {
		return record.results as T[]
	}

	return []
}

export function extractStrapiPagination(payload: unknown): StrapiPagination | undefined {
	if (!payload || typeof payload !== 'object') {
		return undefined
	}

	const record = payload as Record<string, unknown>

	if (record.meta && typeof record.meta === 'object') {
		const meta = record.meta as { pagination?: StrapiPagination }
		return meta.pagination
	}

	if (record.pagination && typeof record.pagination === 'object') {
		return record.pagination as StrapiPagination
	}

	return undefined
}

export function extractStrapiSingle<T>(payload: unknown): T | null {
	if (!payload || typeof payload !== 'object') {
		return null
	}

	const record = payload as Record<string, unknown>

	if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
		return record.data as T
	}

	if (Array.isArray(record.data) && record.data.length > 0) {
		return record.data[0] as T
	}

	if (Array.isArray(record.results) && record.results.length > 0) {
		return record.results[0] as T
	}

	return null
}

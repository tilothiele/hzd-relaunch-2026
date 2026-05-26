type FilterValue = Record<string, unknown>

export function appendStrapiFilters(
	params: URLSearchParams,
	filters: FilterValue,
	prefix = 'filters',
): void {
	for (const [key, value] of Object.entries(filters)) {
		if (key === 'and' && Array.isArray(value)) {
			value.forEach((item, index) => {
				appendStrapiFilters(params, item as FilterValue, `${prefix}[$and][${index}]`)
			})
			continue
		}

		if (key === 'or' && Array.isArray(value)) {
			value.forEach((item, index) => {
				appendStrapiFilters(params, item as FilterValue, `${prefix}[$or][${index}]`)
			})
			continue
		}

		if (key === 'not' && value && typeof value === 'object') {
			appendStrapiFilters(params, value as FilterValue, `${prefix}[$not]`)
			continue
		}

		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			continue
		}

		const operators = Object.entries(value as Record<string, unknown>)
		const isOperatorMap = operators.every(([op]) => (
			op === 'eq'
			|| op === 'ne'
			|| op === 'containsi'
			|| 			op === 'gte'
			|| op === 'lte'
			|| op === 'gt'
			|| op === 'lt'
			|| op === 'null'
			|| op === 'in'
		))

		if (isOperatorMap && operators.length > 0) {
			for (const [op, operatorValue] of operators) {
				if (op === 'null') {
					params.append(`${prefix}[${key}][$null]`, operatorValue ? 'true' : 'false')
					continue
				}

				if (op === 'in') {
					const values = Array.isArray(operatorValue)
						? operatorValue
						: String(operatorValue).split(',').map((v) => v.trim()).filter(Boolean)
					values.forEach((item, index) => {
						params.append(`${prefix}[${key}][$in][${index}]`, String(item))
					})
					continue
				}

				params.append(`${prefix}[${key}][$${op}]`, String(operatorValue))
			}
			continue
		}

		appendStrapiFilters(params, value as FilterValue, `${prefix}[${key}]`)
	}
}

export function buildStrapiQuery(options: {
	filters?: FilterValue
	pagination?: { page?: number; pageSize?: number; limit?: number }
	sort?: string | string[]
	populate?: URLSearchParams | Record<string, string>
	fields?: string[]
	publicationState?: 'live' | 'preview'
} = {}): URLSearchParams {
	const params = new URLSearchParams()

	if (options.filters) {
		appendStrapiFilters(params, options.filters)
	}

	if (options.pagination?.page !== undefined) {
		params.set('pagination[page]', String(options.pagination.page))
	}

	if (options.pagination?.pageSize !== undefined) {
		params.set('pagination[pageSize]', String(options.pagination.pageSize))
	}

	if (options.pagination?.limit !== undefined) {
		params.set('pagination[limit]', String(options.pagination.limit))
	}

	if (options.sort) {
		const sortValues = Array.isArray(options.sort) ? options.sort : [options.sort]
		sortValues.forEach((sortValue, index) => {
			params.set(`sort[${index}]`, sortValue)
		})
	}

	if (options.fields?.length) {
		options.fields.forEach((field, index) => {
			params.set(`fields[${index}]`, field)
		})
	}

	if (options.publicationState === 'preview') {
		params.set('publicationState', 'preview')
	}

	if (options.populate instanceof URLSearchParams) {
		options.populate.forEach((value, key) => {
			params.append(key, value)
		})
	} else if (options.populate) {
		for (const [key, value] of Object.entries(options.populate)) {
			params.append(key, value)
		}
	}

	return params
}

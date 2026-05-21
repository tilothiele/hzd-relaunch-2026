function normalizeParam(value: string | string[] | undefined): string | undefined {
	if (Array.isArray(value)) {
		value = value[0]
	}

	if (typeof value !== 'string') {
		return undefined
	}

	const trimmed = value.trim()

	return trimmed.length > 0 ? trimmed : undefined
}

export function extractResetPasswordCode(
	searchParams: Record<string, string | string[] | undefined>,
): string | undefined {
	for (const key of ['code', 'token', 'resetToken']) {
		const value = normalizeParam(searchParams[key])

		if (value) {
			return value
		}
	}

	return undefined
}

function firstHeaderValue(value: unknown): string | null {
	if (typeof value === 'string') {
		const first = value.split(',')[0]?.trim()
		return first && first.length > 0 ? first : null
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			const first = firstHeaderValue(item)
			if (first) {
				return first
			}
		}
	}

	return null
}

export function extractClientIp(ctx: {
	get?: (name: string) => string | undefined
	request?: {
		ip?: string
		header?: Record<string, unknown>
		headers?: Record<string, unknown>
	}
	ip?: string
}): string | null {
	const header = (name: string): string | null => {
		const fromGetter = ctx.get?.(name)
		if (fromGetter?.trim()) {
			return firstHeaderValue(fromGetter)
		}

		const headers = ctx.request?.header ?? ctx.request?.headers ?? {}
		return firstHeaderValue(headers[name] ?? headers[name.toLowerCase()])
	}

	return header('x-forwarded-for')
		|| header('x-real-ip')
		|| header('cf-connecting-ip')
		|| (typeof ctx.request?.ip === 'string' && ctx.request.ip.trim()
			? ctx.request.ip.trim()
			: null)
		|| (typeof ctx.ip === 'string' && ctx.ip.trim() ? ctx.ip.trim() : null)
}

export function applyClientIp(
	data: Record<string, unknown> | undefined,
	ctx: Parameters<typeof extractClientIp>[0],
): void {
	if (!data || typeof data !== 'object') {
		return
	}

	const existing = typeof data.ClientIP === 'string' ? data.ClientIP.trim() : ''
	if (existing) {
		data.ClientIP = existing
		return
	}

	const ip = extractClientIp(ctx)
	if (ip) {
		data.ClientIP = ip
	}
}

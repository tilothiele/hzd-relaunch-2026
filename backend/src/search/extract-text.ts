const SKIP_KEYS = new Set([
	'id',
	'documentId',
	'createdAt',
	'updatedAt',
	'publishedAt',
	'locale',
	'url',
	'mime',
	'hash',
	'ext',
	'provider',
	'previewUrl',
	'provider_metadata',
	'formats',
	'folderPath',
	'__component',
	'slug',
	'Slug',
	'width',
	'height',
	'size',
])

function decodeEntities(value: string): string {
	return value
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
}

export function htmlToText(value: string): string {
	return decodeEntities(
		value
			.replace(/<script[\s\S]*?<\/script>/gi, ' ')
			.replace(/<style[\s\S]*?<\/style>/gi, ' ')
			.replace(/<[^>]+>/g, ' '),
	)
		.replace(/\s+/g, ' ')
		.trim()
}

function collectText(value: unknown, seen: WeakSet<object>): string[] {
	if (typeof value === 'string') {
		const text = htmlToText(value)
		return text ? [text] : []
	}

	if (!value || typeof value !== 'object') {
		return []
	}

	if (seen.has(value)) {
		return []
	}

	seen.add(value)

	if (Array.isArray(value)) {
		return value.flatMap((entry) => collectText(entry, seen))
	}

	const parts: string[] = []
	for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
		if (SKIP_KEYS.has(key)) {
			continue
		}
		parts.push(...collectText(entry, seen))
	}

	return parts
}

export function extractPlainText(value: unknown, maxLength = 50000): string {
	const text = collectText(value, new WeakSet()).join(' ').replace(/\s+/g, ' ').trim()
	if (text.length <= maxLength) {
		return text
	}
	return text.slice(0, maxLength)
}

export function firstSeoValue(
	seo: unknown,
	field: 'MetaDescription' | 'TitleTag',
): string {
	const entry = Array.isArray(seo) ? seo[0] : seo
	if (!entry || typeof entry !== 'object') {
		return ''
	}
	const value = (entry as Record<string, unknown>)[field]
	return typeof value === 'string' ? htmlToText(value) : ''
}

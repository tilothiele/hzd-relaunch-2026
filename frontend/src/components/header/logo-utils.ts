import type { Image } from '@/types'

export function resolveMediaUrl(media?: Image | null) {
	const mediaPath = media?.url

	if (!mediaPath) {
		return null
	}

	const baseUrl = process.env.NEXT_PUBLIC_STRAPI_BASE_URL ?? ''

	if (/^https?:\/\//.test(mediaPath)) {
		return mediaPath
	}

	if (!baseUrl) {
		return mediaPath
	}

	try {
		const resolvedUrl = new URL(mediaPath, baseUrl)

		if (resolvedUrl.searchParams.has('url')) {
			resolvedUrl.searchParams.delete('url')
		}

		return resolvedUrl.toString()
	} catch {
		return mediaPath
	}
}


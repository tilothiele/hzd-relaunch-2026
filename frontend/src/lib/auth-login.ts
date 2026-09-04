const AUTH_PATH_PREFIXES = [
	'/login',
	'/forgot-password',
	'/reset-password',
	'/api/',
]

/**
 * Nur relative interne Pfade als Redirect nach dem Login zulassen.
 */
export function sanitizeCallbackUrl(raw: string | null | undefined): string {
	if (!raw) {
		return '/'
	}

	let path = raw.trim()

	try {
		if (path.startsWith('http://') || path.startsWith('https://')) {
			const url = new URL(path)
			path = `${url.pathname}${url.search}`
		}
	} catch {
		return '/'
	}

	if (!path.startsWith('/') || path.startsWith('//')) {
		return '/'
	}

	if (AUTH_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
		return '/'
	}

	if (path.includes('error=')) {
		return '/'
	}

	return path
}

export function getLoginCallbackUrl(): string {
	if (typeof window === 'undefined') {
		return '/'
	}

	return sanitizeCallbackUrl(
		`${window.location.pathname}${window.location.search}`,
	)
}

export function getLoginPageHref(): string {
	const callbackUrl = getLoginCallbackUrl()

	if (callbackUrl === '/') {
		return '/login'
	}

	return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
}

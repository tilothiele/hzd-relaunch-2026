/**
 * Callback-URL nach OIDC-Login. Vermeidet OAuth-Fehler-Query-Parameter und
 * /api/auth/*-Pfade, damit NextAuth nicht in Fehler-Schleifen landet.
 */
export function getLoginCallbackUrl(): string {
	if (typeof window === 'undefined') {
		return '/'
	}

	const { origin, pathname, search } = window.location

	if (pathname.startsWith('/api/auth') || search.includes('error=')) {
		return `${origin}/`
	}

	return `${origin}${pathname}${search}`
}

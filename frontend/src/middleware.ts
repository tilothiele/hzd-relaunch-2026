import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
	const response = NextResponse.next()
	response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
	response.headers.set('Pragma', 'no-cache')

	if (
		process.env.NEXTAUTH_DEBUG === 'true'
		&& request.nextUrl.pathname.includes('/api/auth/callback/')
	) {
		console.log('[next-auth] OAuth callback request', {
			pathname: request.nextUrl.pathname,
			hasCode: request.nextUrl.searchParams.has('code'),
			host: request.headers.get('host'),
			forwardedHost: request.headers.get('x-forwarded-host'),
			forwardedProto: request.headers.get('x-forwarded-proto'),
			nextauthUrl: process.env.NEXTAUTH_URL,
			authTrustHost: process.env.AUTH_TRUST_HOST ?? '',
			expectedCallback: process.env.NEXTAUTH_URL
				? `${process.env.NEXTAUTH_URL.replace(/\/$/, '')}/api/auth/callback/authentik`
				: undefined,
		})
	}

	return response
}

export const config = {
	matcher: '/api/auth/:path*',
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
	const token = await getToken({
		req: request,
		secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
	})

	const { pathname } = request.nextUrl

	const isPublicPath =
		pathname === '/login'
		|| pathname.startsWith('/_next')
		|| pathname.startsWith('/static')
		|| pathname.includes('.')

	if (token?.error === 'RefreshAccessTokenError') {
		const loginUrl = new URL('/login', request.url)
		loginUrl.searchParams.set('error', 'SessionExpired')
		return NextResponse.redirect(loginUrl)
	}

	if (!token && !isPublicPath) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	if (token && pathname === '/login') {
		return NextResponse.redirect(new URL('/', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}

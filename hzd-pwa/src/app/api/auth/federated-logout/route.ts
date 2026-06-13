import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import {
	getAuthSecret,
	getPostLogoutRedirectUri,
	prepareAuthentikLogout,
} from '@/lib/authentik-logout'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

interface FederatedLogoutRequestBody {
	postLogoutRedirectUri?: string
}

export async function POST(request: NextRequest) {
	const sessionToken = await getToken({
		req: request,
		secret: getAuthSecret(),
	})

	let body: FederatedLogoutRequestBody = {}
	try {
		body = await request.json() as FederatedLogoutRequestBody
	} catch {
		body = {}
	}

	const postLogoutRedirectUri = getPostLogoutRedirectUri(
		body.postLogoutRedirectUri,
	)

	if (!sessionToken) {
		return NextResponse.json({
			endSessionUrl: null,
			postLogoutRedirectUri,
		})
	}

	const endSessionUrl = await prepareAuthentikLogout({
		idToken: typeof sessionToken.idToken === 'string'
			? sessionToken.idToken
			: undefined,
		refreshToken: typeof sessionToken.refreshToken === 'string'
			? sessionToken.refreshToken
			: undefined,
		accessToken: typeof sessionToken.accessToken === 'string'
			? sessionToken.accessToken
			: undefined,
		postLogoutRedirectUri,
	})

	return NextResponse.json({
		endSessionUrl,
		postLogoutRedirectUri,
	})
}

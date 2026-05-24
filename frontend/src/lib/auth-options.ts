import type { NextAuthOptions } from 'next-auth'
import AuthentikProvider from 'next-auth/providers/authentik'
import type { JWT } from 'next-auth/jwt'

const defaultOidcScope = 'openid email profile offline_access'
const tokenRefreshBufferMs = 60 * 1000

function logAuthentikToken(name: string, value?: unknown) {
	if (process.env.AUTHENTIK_LOG_TOKENS !== 'true' || typeof value !== 'string') {
		return
	}

	console.log(`[authentik] ${name}:`, value)
}

function getIssuer(): string {
	return (process.env.AUTHENTIK_ISSUER ?? '').replace(/\/$/, '')
}

function getTokenEndpoint(): string {
	const configuredEndpoint = process.env.AUTHENTIK_TOKEN_ENDPOINT?.trim()
	if (configuredEndpoint) {
		return configuredEndpoint
	}

	return `${getIssuer()}/token/`
}

function getAccessTokenExpiresAt(account: { expires_at?: number; expires_in?: number }): number {
	if (typeof account.expires_at === 'number') {
		return account.expires_at * 1000
	}

	if (typeof account.expires_in === 'number') {
		return Date.now() + account.expires_in * 1000
	}

	return Date.now()
}

async function refreshAuthentikToken(token: JWT): Promise<JWT> {
	if (!token.refreshToken) {
		return {
			...token,
			error: 'RefreshTokenMissing',
		}
	}

	const response = await fetch(getTokenEndpoint(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			client_id: process.env.AUTHENTIK_CLIENT_ID ?? '',
			grant_type: 'refresh_token',
			refresh_token: token.refreshToken,
		}),
		cache: 'no-store',
	})

	const refreshedTokens = await response.json()

	if (!response.ok) {
		console.error('[authentik] token refresh failed', refreshedTokens)
		return {
			...token,
			error: 'RefreshAccessTokenError',
		}
	}

	if (typeof refreshedTokens.access_token === 'string') {
		logAuthentikToken('refreshed_access_token', refreshedTokens.access_token)
	}

	if (typeof refreshedTokens.id_token === 'string') {
		logAuthentikToken('refreshed_id_token', refreshedTokens.id_token)
	}

	return {
		...token,
		accessToken: typeof refreshedTokens.access_token === 'string'
			? refreshedTokens.access_token
			: token.accessToken,
		idToken: typeof refreshedTokens.id_token === 'string'
			? refreshedTokens.id_token
			: token.idToken,
		accessTokenExpiresAt: Date.now() + Number(refreshedTokens.expires_in ?? 0) * 1000,
		refreshToken: typeof refreshedTokens.refresh_token === 'string'
			? refreshedTokens.refresh_token
			: token.refreshToken,
		error: undefined,
	}
}

export const authOptions: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
	providers: [
		AuthentikProvider({
			clientId: process.env.AUTHENTIK_CLIENT_ID ?? '',
			clientSecret: '',
			issuer: process.env.AUTHENTIK_ISSUER ?? '',
			authorization: {
				params: {
					scope: process.env.AUTHENTIK_SCOPE ?? defaultOidcScope,
				},
			},
			client: {
				token_endpoint_auth_method: 'none',
			},
		}),
	],
	session: {
		strategy: 'jwt',
	},
	callbacks: {
		async jwt({ token, account }) {
			if (account) {
				token.accessTokenExpiresAt = getAccessTokenExpiresAt(account)
			}

			if (account?.refresh_token) {
				token.refreshToken = account.refresh_token
			}

			if (account?.access_token) {
				logAuthentikToken('access_token', account.access_token)
				token.accessToken = account.access_token
			}

			if (account?.id_token) {
				logAuthentikToken('id_token', account.id_token)
				token.idToken = account.id_token
			}

			if (
				typeof token.accessTokenExpiresAt === 'number'
				&& Date.now() < token.accessTokenExpiresAt - tokenRefreshBufferMs
			) {
				return token
			}

			if (token.accessToken || token.idToken) {
				return refreshAuthentikToken(token)
			}

			return token
		},
		async session({ session, token }) {
			session.accessToken = typeof token.accessToken === 'string'
				? token.accessToken
				: undefined
			session.idToken = typeof token.idToken === 'string'
				? token.idToken
				: undefined
			session.error = typeof token.error === 'string'
				? token.error
				: undefined

			return session
		},
	},
}

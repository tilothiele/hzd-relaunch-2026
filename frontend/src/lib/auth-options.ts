import type { NextAuthOptions } from 'next-auth'
import AuthentikProvider from 'next-auth/providers/authentik'

const defaultOidcScope = 'openid email profile'

function logAuthentikToken(name: string, value?: unknown) {
	if (process.env.AUTHENTIK_LOG_TOKENS !== 'true' || typeof value !== 'string') {
		return
	}

	console.log(`[authentik] ${name}:`, value)
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
			if (account?.access_token) {
				logAuthentikToken('access_token', account.access_token)
				token.accessToken = account.access_token
			}

			if (account?.id_token) {
				logAuthentikToken('id_token', account.id_token)
				token.idToken = account.id_token
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

			return session
		},
	},
}

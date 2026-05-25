'use client'

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { setGraphQLAuthToken, fetchGraphQL } from '@/lib/graphql-client'
import { GET_ME } from '@/lib/graphql/queries'
import type { AuthUser } from '@/types'

interface AuthState {
	token: string | null
	user: AuthUser | null
}

interface AuthContextValue {
	authState: AuthState
	isAuthenticated: boolean
	user: AuthUser | null
	authError: string | null
	isAuthenticating: boolean
	handleLogin: () => Promise<void>
	handleLogout: () => Promise<void>
	isInitialized: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
	children: ReactNode
	strapiBaseUrl?: string | null
}

interface GetMeResponse {
	me: AuthUser
}

function createFallbackUser(sessionUser: {
	name?: string | null
	email?: string | null
	image?: string | null
} | undefined): AuthUser | null {
	if (!sessionUser?.email && !sessionUser?.name) {
		return null
	}

	const username = sessionUser.name ?? sessionUser.email ?? 'Account'

	return {
		id: sessionUser.email ?? username,
		documentId: sessionUser.email ?? username,
		username,
		email: sessionUser.email ?? null,
	}
}

export function AuthProvider({ children }: AuthProviderProps) {
	const { data: session, status } = useSession()
	const [authState, setAuthState] = useState<AuthState>({ token: null, user: null })
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(false)
	const [hasMounted, setHasMounted] = useState(false)

	useEffect(() => {
		setHasMounted(true)
	}, [])

	useEffect(() => {
		let isActive = true
		const strapiToken = session?.idToken ?? session?.accessToken ?? null

		async function syncSessionUser() {
			if (!hasMounted || status === 'loading') {
				return
			}

			if (session?.error) {
				setGraphQLAuthToken(null)
				setAuthState({ token: null, user: null })
				setAuthError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.')
				await signOut({ callbackUrl: '/' })
				return
			}

			if (!strapiToken) {
				setGraphQLAuthToken(null)
				setAuthState({ token: null, user: null })
				setAuthError(null)
				return
			}

			setGraphQLAuthToken(strapiToken)
			setAuthError(null)

			try {
				const meData = await fetchGraphQL<GetMeResponse>(GET_ME, {
					token: strapiToken,
				})

				if (!isActive) {
					return
				}

				setAuthState({
					token: strapiToken,
					user: meData.me ?? createFallbackUser(session?.user),
				})
			} catch (error) {
				if (!isActive) {
					return
				}

				console.error('[Auth] Fehler beim Laden des User-Profils:', error)
				setAuthState({
					token: strapiToken,
					user: createFallbackUser(session?.user),
				})
			}
		}

		void syncSessionUser()

		return () => {
			isActive = false
		}
	}, [hasMounted, session, status])

	const handleLogin = useCallback(async () => {
		setIsAuthenticating(true)
		setAuthError(null)

		try {
			await signIn('authentik', {
				callbackUrl: typeof window !== 'undefined'
					? window.location.href
					: '/',
			})
		} finally {
			setIsAuthenticating(false)
		}
	}, [])

	const handleLogout = useCallback(async () => {
		setIsAuthenticating(true)
		setAuthError(null)
		setGraphQLAuthToken(null)

		try {
			await signOut({
				callbackUrl: '/',
			})
		} finally {
			setIsAuthenticating(false)
		}
	}, [])

	const isInitialized = hasMounted && status !== 'loading'
	const isAuthenticated = hasMounted && status === 'authenticated' && Boolean(authState.token)

	const value = useMemo<AuthContextValue>(() => ({
		authState: hasMounted ? authState : { token: null, user: null },
		isAuthenticated,
		user: hasMounted ? authState.user : null,
		authError,
		isAuthenticating: hasMounted && (isAuthenticating || status === 'loading'),
		handleLogin,
		handleLogout,
		isInitialized,
	}), [
		authState,
		authError,
		hasMounted,
		handleLogin,
		handleLogout,
		isAuthenticated,
		isAuthenticating,
		isInitialized,
		status,
	])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


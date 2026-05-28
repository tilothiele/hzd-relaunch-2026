'use client'

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { performFederatedLogout } from '@/lib/federated-logout'
import {
	setStrapiAuthToken,
	setStrapiUnauthorizedHandler,
} from '@/lib/strapi-client'
import { isStrapiUnauthorizedError } from '@/lib/strapi-errors'
import { fetchMe } from '@/lib/strapi/api'
import { getLoginCallbackUrl } from '@/lib/auth-login'
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

	const invalidateSession = useCallback(async () => {
		setStrapiAuthToken(null)
		setAuthState({ token: null, user: null })
		setAuthError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.')
		await signOut({ callbackUrl: '/' })
	}, [])

	useEffect(() => {
		setHasMounted(true)
	}, [])

	useEffect(() => {
		setStrapiUnauthorizedHandler(() => {
			void invalidateSession()
		})

		return () => {
			setStrapiUnauthorizedHandler(null)
		}
	}, [invalidateSession])

	useEffect(() => {
		let isActive = true
		const strapiToken = session?.idToken ?? session?.accessToken ?? null

		async function syncSessionUser() {
			if (!hasMounted || status === 'loading') {
				return
			}

			if (session?.error) {
				await invalidateSession()
				return
			}

			if (!strapiToken) {
				setStrapiAuthToken(null)
				setAuthState({ token: null, user: null })
				setAuthError(null)
				return
			}

			setStrapiAuthToken(strapiToken)
			setAuthError(null)

			try {
				const meData = await fetchMe(strapiToken)

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

				if (isStrapiUnauthorizedError(error)) {
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
	}, [hasMounted, invalidateSession, session, status])

	const handleLogin = useCallback(async () => {
		setIsAuthenticating(true)
		setAuthError(null)

		try {
			await signIn('authentik', {
				callbackUrl: getLoginCallbackUrl(),
				redirect: true,
			})
		} finally {
			setIsAuthenticating(false)
		}
	}, [])

	const handleLogout = useCallback(async () => {
		setIsAuthenticating(true)
		setAuthError(null)
		setStrapiAuthToken(null)
		setAuthState({ token: null, user: null })

		try {
			await performFederatedLogout(`${window.location.origin}/`)
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


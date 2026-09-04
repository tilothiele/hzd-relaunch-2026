'use client'

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
	setStrapiAuthToken,
	setStrapiUnauthorizedHandler,
} from '@/lib/strapi-client'
import { fetchMe } from '@/lib/strapi/api'
import {
	fetchAuthSession,
	loginWithPassword,
	logoutFromBackend,
} from '@/lib/auth-api'
import { getLoginPageHref } from '@/lib/auth-login'
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
	login: (identifier: string, password: string) => Promise<void>
	applyAuthSession: (jwt: string, user: AuthUser | null) => void
	isInitialized: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
	children: ReactNode
	strapiBaseUrl?: string | null
}

export function AuthProvider({ children }: AuthProviderProps) {
	const router = useRouter()
	const [authState, setAuthState] = useState<AuthState>({ token: null, user: null })
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(true)
	const [hasMounted, setHasMounted] = useState(false)
	const [isInitialized, setIsInitialized] = useState(false)

	const applyAuthSession = useCallback((jwt: string, user: AuthUser | null) => {
		setStrapiAuthToken(jwt)
		setAuthState({ token: jwt, user })
		setAuthError(null)
	}, [])

	const clearAuthSession = useCallback(() => {
		setStrapiAuthToken(null)
		setAuthState({ token: null, user: null })
	}, [])

	const invalidateSession = useCallback(async () => {
		clearAuthSession()
		setAuthError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.')
		try {
			await logoutFromBackend()
		} catch (error) {
			console.error('[Auth] Logout nach abgelaufener Sitzung fehlgeschlagen:', error)
		}
	}, [clearAuthSession])

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
		if (!hasMounted) {
			return
		}

		let isActive = true

		async function loadSession() {
			setIsAuthenticating(true)

			try {
				const session = await fetchAuthSession()

				if (!isActive) {
					return
				}

				if (!session.jwt) {
					clearAuthSession()
					setAuthError(null)
					return
				}

				setStrapiAuthToken(session.jwt)

				if (session.user) {
					setAuthState({ token: session.jwt, user: session.user })
					setAuthError(null)
					return
				}

				try {
					const meData = await fetchMe(session.jwt)
					if (!isActive) {
						return
					}
					setAuthState({
						token: session.jwt,
						user: meData.me,
					})
					setAuthError(null)
				} catch (error) {
					if (!isActive) {
						return
					}
					console.error('[Auth] Fehler beim Laden des User-Profils:', error)
					setAuthState({ token: session.jwt, user: null })
				}
			} catch (error) {
				if (!isActive) {
					return
				}
				console.error('[Auth] Session konnte nicht geladen werden:', error)
				clearAuthSession()
			} finally {
				if (isActive) {
					setIsAuthenticating(false)
					setIsInitialized(true)
				}
			}
		}

		void loadSession()

		return () => {
			isActive = false
		}
	}, [clearAuthSession, hasMounted])

	const login = useCallback(async (identifier: string, password: string) => {
		setIsAuthenticating(true)
		setAuthError(null)

		try {
			const result = await loginWithPassword(identifier, password)
			setStrapiAuthToken(result.jwt)

			try {
				const meData = await fetchMe(result.jwt)
				setAuthState({
					token: result.jwt,
					user: meData.me ?? (result.user as AuthUser | null),
				})
			} catch (error) {
				console.error('[Auth] Profil nach Login nicht geladen:', error)
				setAuthState({
					token: result.jwt,
					user: result.user,
				})
			}
		} catch (error) {
			const message = error instanceof Error
				? error.message
				: 'Anmeldung fehlgeschlagen.'
			setAuthError(message)
			throw error instanceof Error ? error : new Error(message)
		} finally {
			setIsAuthenticating(false)
		}
	}, [])

	const handleLogin = useCallback(async () => {
		router.push(getLoginPageHref())
	}, [router])

	const handleLogout = useCallback(async () => {
		setIsAuthenticating(true)
		setAuthError(null)
		clearAuthSession()

		try {
			await logoutFromBackend()
		} catch (error) {
			console.error('[Auth] Logout fehlgeschlagen:', error)
		} finally {
			setIsAuthenticating(false)
			window.location.assign('/')
		}
	}, [clearAuthSession])

	const isAuthenticated = hasMounted && Boolean(authState.token)

	const value = useMemo<AuthContextValue>(() => ({
		authState: hasMounted ? authState : { token: null, user: null },
		isAuthenticated,
		user: hasMounted ? authState.user : null,
		authError,
		isAuthenticating: hasMounted && (isAuthenticating || !isInitialized),
		handleLogin,
		handleLogout,
		login,
		applyAuthSession,
		isInitialized: hasMounted && isInitialized,
	}), [
		applyAuthSession,
		authState,
		authError,
		hasMounted,
		handleLogin,
		handleLogout,
		isAuthenticated,
		isAuthenticating,
		isInitialized,
		login,
	])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

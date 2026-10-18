'use client'

import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
	fetchAuthSession,
	loginWithPassword,
	logoutFromBackend,
} from '@/lib/auth-api'
import { getLoginPageHref } from '@/lib/auth-login'
import type { AuthUser } from '@/types/auth-user'

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
	isInitialized: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(
	undefined,
)

interface AuthProviderProps {
	children: ReactNode
}

const SESSION_EXPIRED_MESSAGE =
	'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.'

export function AuthProvider({ children }: AuthProviderProps) {
	const router = useRouter()
	const [authState, setAuthState] = useState<AuthState>({
		token: null,
		user: null,
	})
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(true)
	const [isInitialized, setIsInitialized] = useState(false)

	const clearAuthSession = useCallback(() => {
		setAuthState({ token: null, user: null })
	}, [])

	useEffect(() => {
		let isActive = true

		async function loadSession() {
			setIsAuthenticating(true)

			try {
				const session = await fetchAuthSession()

				if (!isActive) {
					return
				}

				if (session.expired) {
					clearAuthSession()
					setAuthError(SESSION_EXPIRED_MESSAGE)
					router.replace('/login?error=SessionExpired')
					return
				}

				if (!session.jwt) {
					clearAuthSession()
					setAuthError(null)
					return
				}

				setAuthState({
					token: session.jwt,
					user: session.user ?? null,
				})
				setAuthError(null)
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
	}, [clearAuthSession, router])

	const login = useCallback(async (
		identifier: string,
		password: string,
	) => {
		setIsAuthenticating(true)
		setAuthError(null)

		try {
			const result = await loginWithPassword(identifier, password)
			setAuthState({
				token: result.jwt,
				user: result.user,
			})
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
			router.push('/login')
			router.refresh()
		}
	}, [clearAuthSession, router])

	const isAuthenticated = Boolean(authState.token)

	const value = useMemo<AuthContextValue>(() => ({
		authState,
		isAuthenticated,
		user: authState.user,
		authError,
		isAuthenticating: isAuthenticating || !isInitialized,
		handleLogin,
		handleLogout,
		login,
		isInitialized,
	}), [
		authState,
		authError,
		handleLogin,
		handleLogout,
		isAuthenticated,
		isAuthenticating,
		isInitialized,
		login,
	])

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	)
}

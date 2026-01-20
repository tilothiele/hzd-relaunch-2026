'use client'

import { useCallback, useEffect, useState, useContext } from 'react'
import { setGraphQLAuthToken } from '@/lib/graphql-client'
import type { AuthUser } from '@/types'
import { AuthContext } from '@/contexts/auth-context'

interface AuthState {
	token: string | null
	user: AuthUser | null
}

interface LoginCredentials {
	identifier: string
	password: string
}

interface StrapiAuthResponse {
	jwt: string
	user: AuthUser
}

const AUTH_STORAGE_KEY = 'hzd_auth_state'

function loadAuthState(): AuthState {
	if (typeof window === 'undefined') {
		return { token: null, user: null }
	}

	try {
		const stored = localStorage.getItem(AUTH_STORAGE_KEY)
		if (stored) {
			const parsed = JSON.parse(stored) as AuthState
			if (parsed.token && parsed.user) {
				setGraphQLAuthToken(parsed.token)
				return parsed
			}
		}
	} catch {
		// Ignore parse errors
	}

	return { token: null, user: null }
}

function saveAuthState(state: AuthState) {
	if (typeof window === 'undefined') {
		return
	}

	try {
		if (state.token && state.user) {
			localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
		} else {
			localStorage.removeItem(AUTH_STORAGE_KEY)
		}
	} catch {
		// Ignore storage errors
	}
}

export function useAuth(strapiBaseUrl?: string | null) {
	// Versuche zuerst, den Context zu verwenden (wenn verfügbar)
	const context = useContext(AuthContext)

	// Wenn Context verfügbar ist, verwende ihn
	if (context !== undefined) {
		return context
	}

	// Fallback: Alte Implementierung für Komponenten ohne Context
	// Initialisiere immer mit null, um Hydration-Fehler zu vermeiden
	// Der tatsächliche Wert wird nach dem Mount geladen
	const [authState, setAuthState] = useState<AuthState>({ token: null, user: null })
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(false)
	const [isInitialized, setIsInitialized] = useState(false)

	useEffect(() => {
		const loaded = loadAuthState()
		if (loaded.token && loaded.user) {
			setAuthState(loaded)
		}
		setIsInitialized(true)
	}, [])

	const handleLogin = useCallback(async ({ identifier, password }: LoginCredentials) => {
		setIsAuthenticating(true)
		setAuthError(null)

		try {
			// Verwende Next.js API-Route als Proxy, um CORS-Probleme zu vermeiden
			const response = await fetch('/api/auth/local', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ identifier, password }),
			})

			if (!response.ok) {
				const errorPayload = await response.json().catch(() => null)
				const message =
					errorPayload?.error?.message ??
					'Anmeldung fehlgeschlagen. Bitte Zugangsdaten prüfen.'
				throw new Error(message)
			}

			const result = (await response.json()) as StrapiAuthResponse

			const newState: AuthState = {
				token: result.jwt,
				user: result.user,
			}

			setAuthState(newState)
			setGraphQLAuthToken(result.jwt)
			saveAuthState(newState)
		} catch (error) {
			if (error instanceof Error) {
				setAuthError(error.message)
				throw error
			}

			const fallbackError = new Error('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.')
			setAuthError(fallbackError.message)
			throw fallbackError
		} finally {
			setIsAuthenticating(false)
		}
	}, [strapiBaseUrl])

	const handleLogout = useCallback(() => {
		const newState: AuthState = { token: null, user: null }
		setAuthState(newState)
		setAuthError(null)
		setGraphQLAuthToken(null)
		saveAuthState(newState)
	}, [])

	return {
		authState,
		isAuthenticated: Boolean(authState.token),
		user: authState.user,
		authError,
		isAuthenticating,
		handleLogin,
		handleLogout,
		isInitialized,
	}
}



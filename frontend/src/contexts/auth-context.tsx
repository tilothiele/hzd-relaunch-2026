'use client'

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { setGraphQLAuthToken } from '@/lib/graphql-client'
import type { AuthUser } from '@/types'

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

interface AuthContextValue {
	authState: AuthState
	isAuthenticated: boolean
	user: AuthUser | null
	authError: string | null
	isAuthenticating: boolean
	handleLogin: (credentials: LoginCredentials) => Promise<void>
	handleLogout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_STORAGE_KEY = 'hzd_auth_state'

/**
 * Dekodiert einen Base64URL-String
 */
function decodeBase64URL(base64url: string): string {
	try {
		// Base64URL dekodieren (ersetzt - durch + und _ durch /)
		const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')

		// Padding hinzufügen falls nötig
		const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)

		// Base64 dekodieren
		return atob(padded)
	} catch (error) {
		console.error('Fehler beim Dekodieren:', error)
		throw error
	}
}

/**
 * Dekodiert einen JWT-Token und gibt Header und Payload zurück.
 * @param token - Der JWT-Token String
 * @returns Objekt mit header, payload und dem vollständigen Token oder null bei Fehler
 */
function decodeJWT(token: string): { header: Record<string, unknown>; payload: Record<string, unknown>; fullToken: string } | null {
	try {
		// JWT hat das Format: header.payload.signature
		const parts = token.split('.')
		if (parts.length !== 3) {
			console.error('Ungültiges JWT-Format')
			return null
		}

		// Dekodiere Header (erster Teil)
		const headerDecoded = decodeBase64URL(parts[0])
		const header = JSON.parse(headerDecoded) as Record<string, unknown>

		// Dekodiere Payload (zweiter Teil)
		const payloadDecoded = decodeBase64URL(parts[1])
		const payload = JSON.parse(payloadDecoded) as Record<string, unknown>

		return {
			header,
			payload,
			fullToken: token,
		}
	} catch (error) {
		console.error('Fehler beim Dekodieren des JWT-Tokens:', error)
		return null
	}
}

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

interface AuthProviderProps {
	children: ReactNode
	strapiBaseUrl?: string | null
}

export function AuthProvider({ children, strapiBaseUrl }: AuthProviderProps) {
	// Initialisiere immer mit null, um Hydration-Fehler zu vermeiden
	// Der tatsächliche Wert wird nach dem Mount geladen
	const [authState, setAuthState] = useState<AuthState>({ token: null, user: null })
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(false)

	// Lade Auth-Status beim Mount
	useEffect(() => {
		const loaded = loadAuthState()
		if (loaded.token && loaded.user) {
			setAuthState(loaded)
		}
	}, [])

	// Höre auf localStorage Änderungen (für Cross-Tab-Synchronisation)
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === AUTH_STORAGE_KEY) {
				const loaded = loadAuthState()
				setAuthState(loaded)
			}
		}

		window.addEventListener('storage', handleStorageChange)
		return () => {
			window.removeEventListener('storage', handleStorageChange)
		}
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

			// Dekodiere und logge den JWT-Token
			const decodedToken = decodeJWT(result.jwt)
			if (decodedToken) {
				console.log('=== JWT Token Dekodiert ===')
				console.log('Header:', decodedToken.header)
				console.log('Payload:', decodedToken.payload)
				console.log('Vollständiger Token:', decodedToken.fullToken)
				console.log('Token Länge:', decodedToken.fullToken.length, 'Zeichen')
				
				// Zeige auch die User-Daten aus der Response
				console.log('User-Daten (aus Response):', result.user)
			} else {
				console.warn('JWT-Token konnte nicht dekodiert werden')
			}

			setAuthState(newState)
			setGraphQLAuthToken(result.jwt)
			saveAuthState(newState)

			// Dispatch custom event für Cross-Component-Synchronisation
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new Event('auth-state-changed'))
			}
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

		// Dispatch custom event für Cross-Component-Synchronisation
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new Event('auth-state-changed'))
		}
	}, [])

	// Höre auf custom events für Auth-Status-Änderungen
	useEffect(() => {
		const handleAuthStateChange = () => {
			const loaded = loadAuthState()
			setAuthState(loaded)
		}

		window.addEventListener('auth-state-changed', handleAuthStateChange)
		return () => {
			window.removeEventListener('auth-state-changed', handleAuthStateChange)
		}
	}, [])

	const value: AuthContextValue = {
		authState,
		isAuthenticated: Boolean(authState.token),
		user: authState.user,
		authError,
		isAuthenticating,
		handleLogin,
		handleLogout,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


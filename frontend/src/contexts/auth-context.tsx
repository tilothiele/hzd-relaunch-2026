'use client'

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { setGraphQLAuthToken, fetchGraphQL } from '@/lib/graphql-client'
import { GET_ME } from '@/lib/graphql/queries'
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
	jwt: string | { jwt?: string; token?: string } | unknown
	user: {
		id: number | string
		username?: string | null
		email?: string | null
		// Weitere Felder können vorhanden sein, werden aber durch GET_ME überschrieben
		[key: string]: unknown
	}
}

interface AuthContextValue {
	authState: AuthState
	isAuthenticated: boolean
	user: AuthUser | null
	authError: string | null
	isAuthenticating: boolean
	handleLogin: (credentials: LoginCredentials) => Promise<void>
	handleLogout: () => void
	isInitialized: boolean
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

interface GetMeResponse {
	me: AuthUser
}

export function AuthProvider({ children, strapiBaseUrl }: AuthProviderProps) {
	// Initialisiere immer mit null, um Hydration-Fehler zu vermeiden
	// Der tatsächliche Wert wird nach dem Mount geladen
	const [authState, setAuthState] = useState<AuthState>({ token: null, user: null })
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(false)
	const [isInitialized, setIsInitialized] = useState(false)

	// Lade Auth-Status beim Mount
	useEffect(() => {
		const loaded = loadAuthState()
		if (loaded.token && loaded.user) {
			setAuthState(loaded)
		}
		setIsInitialized(true)
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

			// Normalisiere Token: Prüfe verschiedene mögliche Stellen
			let jwtToken: string | null = null

			// 1. Prüfe result.jwt (Standard-Strapi)
			if (typeof result.jwt === 'string' && result.jwt.length > 0) {
				jwtToken = result.jwt
			} else if (result.jwt && typeof result.jwt === 'object') {
				const jwtObj = result.jwt as Record<string, unknown>
				if (typeof jwtObj.jwt === 'string') {
					jwtToken = jwtObj.jwt
				} else if (typeof jwtObj.token === 'string') {
					jwtToken = jwtObj.token
				}
			}

			// 2. Prüfe result.token (Alternative)
			if (!jwtToken && 'token' in result && typeof (result as { token?: unknown }).token === 'string') {
				jwtToken = (result as { token: string }).token
			}

			// 3. Prüfe result.data.token (falls verschachtelt)
			if (!jwtToken && 'data' in result) {
				const data = (result as { data?: { token?: string; jwt?: string } }).data
				if (data?.token && typeof data.token === 'string') {
					jwtToken = data.token
				} else if (data?.jwt && typeof data.jwt === 'string') {
					jwtToken = data.jwt
				}
			}

			if (!jwtToken) {
				console.error('[Auth] Kein gültiger JWT-Token in Response gefunden. Vollständige Response:', JSON.stringify(result, null, 2))
				throw new Error('Ungültige Login-Response: Kein Token gefunden. Bitte JWT-Konfiguration in Strapi prüfen.')
			}

			// Dekodiere und logge den JWT-Token
			const decodedToken = decodeJWT(jwtToken)
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

			// Setze Token für GraphQL-Requests
			setGraphQLAuthToken(jwtToken)

			// Hole vollständiges User-Profil mit GET_ME
			let fullUserProfile: AuthUser | null = null
			try {
				const meData = await fetchGraphQL<GetMeResponse>(
					GET_ME,
					{
						token: jwtToken,
					},
				)

				if (meData?.me) {
					fullUserProfile = meData.me
					console.log('[Auth] Vollständiges User-Profil geladen:', fullUserProfile)
				} else {
					console.warn('[Auth] GET_ME hat keine Daten zurückgegeben, verwende User aus Login-Response')
					// Fallback: Konvertiere Login-Response zu AuthUser
					fullUserProfile = {
						id: String(result.user.id),
						documentId: String(result.user.id),
						username: result.user.username || '',
						email: result.user.email || null,
					}
				}
			} catch (error) {
				console.error('[Auth] Fehler beim Laden des User-Profils:', error)
				console.warn('[Auth] Verwende User-Daten aus Login-Response als Fallback')
				// Fallback: Konvertiere Login-Response zu AuthUser
				fullUserProfile = {
					id: String(result.user.id),
					documentId: String(result.user.id),
					username: result.user.username || '',
					email: result.user.email || null,
				}
			}

			const newState: AuthState = {
				token: jwtToken,
				user: fullUserProfile,
			}

			setAuthState(newState)
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
		isInitialized,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


'use client'

import { useCallback, useMemo, useState } from 'react'
import type { Startpage, AuthUser } from '@/types'
import { Header } from '@/components/header/header'
import { setGraphQLAuthToken } from '@/lib/graphql-client'

interface HomePageContentProps {
	homepage: Startpage
}

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

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337'

export function HomePageContent({ homepage }: HomePageContentProps) {
	const [authState, setAuthState] = useState<AuthState>({ token: null, user: null })
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(false)

	const isAuthenticated = useMemo(() => Boolean(authState.token), [authState.token])

	const handleLogin = useCallback(async ({ identifier, password }: LoginCredentials) => {
		setIsAuthenticating(true)
		setAuthError(null)

		try {
			const response = await fetch(`${strapiUrl}/api/auth/local`, {
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

			setAuthState({
				token: result.jwt,
				user: result.user,
			})
			setGraphQLAuthToken(result.jwt)
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
	}, [])

	const handleLogout = useCallback(() => {
		setAuthState({ token: null, user: null })
		setAuthError(null)
		setGraphQLAuthToken(null)
	}, [])

	return (
		<>
			<Header
				startpage={homepage}
				isAuthenticated={isAuthenticated}
				user={authState.user}
				onLogin={handleLogin}
				onLogout={handleLogout}
				isAuthenticating={isAuthenticating}
				error={authError}
			/>
			<main>

			</main>
		</>
	)
}


'use client'

import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import type { Startpage, AuthUser } from '@/types'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { setGraphQLAuthToken } from '@/lib/graphql-client'
import { useTheme } from '@/hooks/use-theme'

interface HomePageContentProps {
	homepage: Startpage
	strapiBaseUrl: string
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

export function HomePageContent({ homepage, strapiBaseUrl }: HomePageContentProps) {
	const [authState, setAuthState] = useState<AuthState>({ token: null, user: null })
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(false)
	const { theme } = useTheme()

	const isAuthenticated = useMemo(() => Boolean(authState.token), [authState.token])
	const themeStyles = useMemo(() => ({
		'--theme-text-color': theme.textColor,
		'--theme-heading-color': theme.headerBackground,
		color: theme.textColor,
	}) as CSSProperties, [theme])

	const handleLogin = useCallback(async ({ identifier, password }: LoginCredentials) => {
		setIsAuthenticating(true)
		setAuthError(null)

		try {
			const response = await fetch(`${strapiBaseUrl}/api/auth/local`, {
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
	}, [strapiBaseUrl])

	const handleLogout = useCallback(() => {
		setAuthState({ token: null, user: null })
		setAuthError(null)
		setGraphQLAuthToken(null)
	}, [])

	return (
		<div style={themeStyles}>
			<Header
				startpage={homepage}
				strapiBaseUrl={strapiBaseUrl}
				theme={theme}
				isAuthenticated={isAuthenticated}
				user={authState.user}
				onLogin={handleLogin}
				onLogout={handleLogout}
				isAuthenticating={isAuthenticating}
				error={authError}
			/>
			<main>

			</main>
			<Footer
				startpage={homepage}
				strapiBaseUrl={strapiBaseUrl}
				theme={theme}
			/>
			<CookieBanner />
		</div>
	)
}


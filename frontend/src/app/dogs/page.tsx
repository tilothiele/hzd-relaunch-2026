'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Skeleton } from '@chakra-ui/react'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_STARTPAGE } from '@/lib/graphql/queries'
import { useConfig } from '@/hooks/use-config'
import type { Startpage, AuthUser } from '@/types'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { DogSearch } from '@/components/dog-search/dog-search'
import { setGraphQLAuthToken } from '@/lib/graphql-client'
import { useTheme } from '@/hooks/use-theme'
import type { CSSProperties } from 'react'

interface StartpageData {
	startpage: Startpage
}

type StatusType = 'loading' | 'error' | 'empty' | null

interface StatusState {
	type: StatusType
	message: string | null
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

function DogsPageSkeleton() {
	return (
		<div
			className='flex min-h-screen flex-col gap-8 px-4 py-12'
			aria-busy='true'
			aria-live='polite'
		>
			<Skeleton height='5rem' borderRadius='md' />
			<Skeleton height='20rem' borderRadius='md' />
			<Skeleton height='12rem' borderRadius='md' />
		</div>
	)
}

export default function DogsPage() {
	const { config, isLoading: isConfigLoading, error: configError } = useConfig()
	const [startpage, setStartpage] = useState<Startpage | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [authState, setAuthState] = useState<AuthState>({ token: null, user: null })
	const [authError, setAuthError] = useState<string | null>(null)
	const [isAuthenticating, setIsAuthenticating] = useState(false)
	const { theme } = useTheme()

	const baseUrl = config.strapiBaseUrl

	const loadStartpage = useCallback(async (resolvedBaseUrl?: string | null) => {
		try {
			setIsLoading(true)
			const data = await fetchGraphQL<StartpageData>(
				GET_STARTPAGE,
				{ baseUrl: resolvedBaseUrl ?? baseUrl },
			)
			setStartpage(data.startpage)
			setError(null)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Startpage konnte nicht geladen werden.')
			setError(fetchError)
			setStartpage(null)
		} finally {
			setIsLoading(false)
		}
	}, [baseUrl])

	useEffect(() => {
		if (!baseUrl || baseUrl.trim().length === 0) {
			return
		}

		void loadStartpage(baseUrl)
	}, [baseUrl, loadStartpage])

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
			const response = await fetch(`${baseUrl}/api/auth/local`, {
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
	}, [baseUrl])

	const handleLogout = useCallback(() => {
		setAuthState({ token: null, user: null })
		setAuthError(null)
		setGraphQLAuthToken(null)
	}, [])

	const isBusy = isConfigLoading || isLoading

	const status = useMemo<StatusState>(() => {
		if (!baseUrl) {
			if (configError) {
				return {
					type: 'error',
					message: 'Konfiguration konnte nicht geladen werden.',
				}
			}

			return {
				type: 'loading',
				message: null,
			}
		}

		if (isBusy) {
			return {
				type: 'loading',
				message: null,
			}
		}

		if (configError) {
			return {
				type: 'error',
				message: 'Konfiguration konnte nicht geladen werden.',
			}
		}

		if (error) {
			return {
				type: 'error',
				message: error.message ?? 'Startpage konnte nicht geladen werden.',
			}
		}

		if (!startpage) {
			return {
				type: 'empty',
				message:
					'Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.',
			}
		}

		return {
			type: null,
			message: null,
		}
	}, [baseUrl, configError, error, isBusy, startpage])

	if (status.type === 'loading') {
		return <DogsPageSkeleton />
	}

	if (status.type) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{status.message}</p>
			</div>
		)
	}

	return (
		<div style={themeStyles}>
			<Header
				startpage={startpage!}
				strapiBaseUrl={baseUrl!}
				theme={theme}
				isAuthenticated={isAuthenticated}
				user={authState.user}
				onLogin={handleLogin}
				onLogout={handleLogout}
				isAuthenticating={isAuthenticating}
				error={authError}
			/>
			<main>
				<DogSearch strapiBaseUrl={baseUrl!} />
			</main>
			<Footer
				startpage={startpage!}
				strapiBaseUrl={baseUrl!}
				theme={theme}
			/>
			<CookieBanner />
		</div>
	)
}


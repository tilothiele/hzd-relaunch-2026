'use client'

import { useMemo, type CSSProperties } from 'react'
import { useGlobalLayout } from '@/hooks/use-global-layout'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { LitterSearch } from '@/components/litter-search/litter-search'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'

export const dynamic = 'force-dynamic'

function LittersPageSkeleton() {
	return (
		<div
			className='flex min-h-screen flex-col gap-8 px-4 py-12'
			aria-busy='true'
			aria-live='polite'
		>
			<div className='h-20 w-full animate-pulse rounded-md bg-gray-200' />
			<div className='h-80 w-full animate-pulse rounded-md bg-gray-200' />
			<div className='h-48 w-full animate-pulse rounded-md bg-gray-200' />
		</div>
	)
}

export default function LittersPage() {
	const { globalLayout, isLoading, error, baseUrl } = useGlobalLayout()
	const { theme } = useTheme()
	const {
		isAuthenticated,
		user,
		authError,
		isAuthenticating,
		handleLogin,
		handleLogout,
	} = useAuth(baseUrl || '')

	const themeStyles = useMemo(() => ({
		'--theme-text-color': theme.textColor,
		'--theme-heading-color': theme.headerBackground,
		color: theme.textColor,
	}) as CSSProperties, [theme])

	if (isLoading || !globalLayout) {
		return <LittersPageSkeleton />
	}

	if (error) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{error.message ?? 'GlobalLayout konnte nicht geladen werden.'}</p>
			</div>
		)
	}

	if (!baseUrl) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>Konfiguration konnte nicht geladen werden.</p>
			</div>
		)
	}

	return (
		<div style={themeStyles}>
			<Header
				globalLayout={globalLayout}
				strapiBaseUrl={baseUrl}
				theme={theme}
				isAuthenticated={isAuthenticated}
				user={user}
				onLogin={handleLogin}
				onLogout={handleLogout}
				isAuthenticating={isAuthenticating}
				error={authError}
			/>
			<main>
				<LitterSearch
					strapiBaseUrl={baseUrl}
					hzdSetting={globalLayout.HzdSetting}
				/>
			</main>
			<Footer
				globalLayout={globalLayout}
				strapiBaseUrl={baseUrl}
				theme={theme}
			/>
			<CookieBanner />
		</div>
	)
}


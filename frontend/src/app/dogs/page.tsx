'use client'

import { useMemo, type CSSProperties } from 'react'
import { Skeleton } from '@chakra-ui/react'
import { useGlobalLayout } from '@/hooks/use-global-layout'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { DogSearch } from '@/components/dog-search/dog-search'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'

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

	if (isLoading || !globalLayout || !baseUrl) {
		return <DogsPageSkeleton />
	}

	if (error) {
		return (
			<div className='flex min-h-screen items-center justify-center px-4 text-center text-sm text-gray-600'>
				<p>{error.message ?? 'GlobalLayout konnte nicht geladen werden.'}</p>
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
				pageTitle='Hunde'
			/>
			<main className='flex w-full justify-center'>
				<div className='w-full max-w-[1200px]'>
					<DogSearch strapiBaseUrl={baseUrl} />
				</div>
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


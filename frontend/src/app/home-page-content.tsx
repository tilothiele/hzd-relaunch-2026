'use client'

import { useMemo, type CSSProperties } from 'react'
import type { GlobalLayout } from '@/types'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'
import { renderStartpageSections } from '@/components/sections/section-factory'

interface HomePageContentProps {
	homepage: GlobalLayout
	strapiBaseUrl: string
}

export function HomePageContent({ homepage, strapiBaseUrl }: HomePageContentProps) {
	const { theme } = useTheme()
	const sections = homepage.Sections ?? []
	const {
		isAuthenticated,
		user,
		authError,
		isAuthenticating,
		handleLogin,
		handleLogout,
	} = useAuth(strapiBaseUrl)

	const themeStyles = useMemo(() => ({
		'--theme-text-color': theme.textColor,
		'--theme-heading-color': theme.headerBackground,
		color: theme.textColor,
	}) as CSSProperties, [theme])

	return (
		<div style={themeStyles}>
			<Header
				globalLayout={homepage}
				strapiBaseUrl={strapiBaseUrl}
				theme={theme}
				isAuthenticated={isAuthenticated}
				user={user}
				onLogin={handleLogin}
				onLogout={handleLogout}
				isAuthenticating={isAuthenticating}
				error={authError}
			/>
			<main className='flex flex-col gap-12'>
				{renderStartpageSections({ sections, strapiBaseUrl })}
			</main>
			<Footer
				globalLayout={homepage}
				strapiBaseUrl={strapiBaseUrl}
				theme={theme}
			/>
			<CookieBanner />
		</div>
	)
}


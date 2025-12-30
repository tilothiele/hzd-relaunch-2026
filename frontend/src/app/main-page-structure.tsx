'use client'

import { useMemo, type CSSProperties } from 'react'
import type { GlobalLayout, StartpageSection } from '@/types'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { useAuth } from '@/hooks/use-auth'
import { DEFAULT_THEME_ID, themes, type ThemeDefinition } from '@/themes'
import { renderStartpageSections } from '@/components/sections/section-factory'

const textSkeletonKeys = [
	'text-primary',
	'text-secondary',
	'text-tertiary',
	'text-quaternary',
] as const

function MainPageSkeleton() {
	return (
		<div
			className='flex min-h-screen flex-col gap-8 px-4 py-12'
			aria-busy='true'
			aria-live='polite'
		>
			<div className='h-20 w-full animate-pulse rounded-md bg-gray-200' />
			<div className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
				<div className='h-80 w-full animate-pulse rounded-md bg-gray-200' />
				<div className='flex flex-col gap-4'>
					<div className='h-14 w-full animate-pulse rounded-md bg-gray-200' />
					<div className='h-14 w-full animate-pulse rounded-md bg-gray-200' />
					<div className='h-14 w-full animate-pulse rounded-md bg-gray-200' />
				</div>
			</div>
			<div className='h-48 w-full animate-pulse rounded-md bg-gray-200' />
			<div className='flex flex-col gap-4'>
				{textSkeletonKeys.map((key) => (
					<div
						key={key}
						className='h-5 w-full animate-pulse rounded-md bg-gray-200'
					/>
				))}
			</div>
		</div>
	)
}


interface MainPageStructure {
	homepage?: GlobalLayout | null
	pageTitle?: string | null
	strapiBaseUrl?: string | null
	theme?: ThemeDefinition | null
	children?: React.ReactNode
	sections?: StartpageSection[] | null
	loading?: boolean
}

export function MainPageStructure({ homepage, strapiBaseUrl, loading = false, pageTitle, theme, children, sections }: MainPageStructure) {
	const {
		isAuthenticated,
		user,
		authError,
		isAuthenticating,
		handleLogin,
		handleLogout,
	} = useAuth(strapiBaseUrl)

	const themex = theme || themes[DEFAULT_THEME_ID]

	const themeStyles = useMemo(() => ({
		'--theme-text-color': themex.textColor,
		'--theme-heading-color': themex.headerBackground,
		color: themex.textColor,
	}) as CSSProperties, [theme])

	if (!!loading || !homepage) {
		return <MainPageSkeleton />
	}

	// Bevorzuge children (Server Components), falls vorhanden, sonst rendere sections (Client Components)
	const content = children ?? (sections && strapiBaseUrl
		? renderStartpageSections({ sections, strapiBaseUrl, theme: themex })
		: null)

	return (
		<div style={themeStyles}>
			<Header
				globalLayout={homepage}
				pageTitle={pageTitle}
				strapiBaseUrl={strapiBaseUrl}
				theme={themex}
				isAuthenticated={isAuthenticated}
				user={user}
				onLogin={handleLogin}
				onLogout={handleLogout}
				isAuthenticating={isAuthenticating}
				error={authError}
			/>
			<main className='flex flex-col' style={{
				color: '#000000',
				backgroundColor: '#ffffff',
			}}>
				{content}
			</main>
			<Footer
				globalLayout={homepage}
				strapiBaseUrl={strapiBaseUrl}
				theme={themex}
			/>
			<CookieBanner />
		</div>
	)
}


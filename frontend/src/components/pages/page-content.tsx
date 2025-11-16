'use client'

import { useMemo, type CSSProperties } from 'react'
import { Skeleton } from '@chakra-ui/react'
import type { GlobalLayout, Page } from '@/types'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'
import { renderStartpageSections } from '@/components/sections/section-factory'

interface PageContentProps {
	page: Page
	globalLayout: GlobalLayout | null
	strapiBaseUrl: string
}

function PageSkeleton() {
	return (
		<div className='flex min-h-screen flex-col gap-8 px-4 py-12'>
			<Skeleton height='5rem' borderRadius='md' />
			<div className='grid gap-6 lg:grid-cols-[2fr_1fr]'>
				<Skeleton height='20rem' borderRadius='md' />
				<div className='flex flex-col gap-4'>
					<Skeleton height='3.5rem' borderRadius='md' />
					<Skeleton height='3.5rem' borderRadius='md' />
					<Skeleton height='3.5rem' borderRadius='md' />
				</div>
			</div>
			<Skeleton height='12rem' borderRadius='md' />
		</div>
	)
}

export function PageContent({ page, globalLayout, strapiBaseUrl }: PageContentProps) {
	if (!globalLayout) {
		return <PageSkeleton />
	}
	const { theme } = useTheme()
	const sections = page.Sections ?? []
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

	const emptyStateClasses = [
		'flex',
		'min-h-[50vh]',
		'flex-col',
		'items-center',
		'justify-center',
		'gap-4',
		'px-4',
		'py-16',
		'text-center',
	].join(' ')

	if (!sections.length) {
		return (
			<div style={themeStyles}>
				<Header
					globalLayout={globalLayout}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
					isAuthenticated={isAuthenticated}
					user={user}
					onLogin={handleLogin}
					onLogout={handleLogout}
					isAuthenticating={isAuthenticating}
					error={authError}
				/>
				<main className={emptyStateClasses}>
					<h1 className='text-3xl font-semibold text-neutral-900'>
						Seite wird vorbereitet
					</h1>
					<p className='max-w-xl text-base text-neutral-600'>
						Für diese Seite sind noch keine Inhalte hinterlegt.
						{' '}
						Bitte versuchen Sie es zu einem späteren Zeitpunkt erneut.
					</p>
				</main>
				<Footer
					globalLayout={globalLayout}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
				<CookieBanner />
			</div>
		)
	}

	return (
		<div style={themeStyles}>
			<Header
				globalLayout={globalLayout}
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
				globalLayout={globalLayout}
				strapiBaseUrl={strapiBaseUrl}
				theme={theme}
			/>
			<CookieBanner />
		</div>
	)
}



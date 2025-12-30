'use client'

import { useMemo, type CSSProperties } from 'react'
import { useGlobalLayout } from '@/hooks/use-global-layout'
import { Header } from '@/components/header/header'
import { Footer } from '@/components/footer/footer'
import { CookieBanner } from '@/components/cookie-banner/cookie-banner'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'
import { FormsInstanceSearch } from '@/components/form-instance-search/form-instance-search'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { MainPageStructure } from '../main-page-structure'

export const dynamic = 'force-dynamic'

function FormsInstanceSkeleton() {
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
export default function FormInstancePage() {
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
		return <FormsInstanceSkeleton />
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

	const pageTitle = 'Eingegangene Anmeldungen'

	return (
		<MainPageStructure
			homepage={globalLayout}
			strapiBaseUrl={baseUrl}
			theme={theme}
			pageTitle={pageTitle}
		>
			<SectionContainer variant='max-width'>
				<div className='flex min-h-[50vh] items-center justify-center py-12'>
					<FormsInstanceSearch strapiBaseUrl={baseUrl} />
				</div>
			</SectionContainer>
		</MainPageStructure>
	)
}


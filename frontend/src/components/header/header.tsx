'use client'

import type { MenuItem, AuthUser, GlobalLayout } from '@/types'
import type { ThemeDefinition } from '@/themes'
import Image from 'next/image'
import Link from 'next/link'
import { NavigationMenu } from '@/components/ui/navigation-menu'
import { SocialLinks } from './social-links'
import { LoginControls } from './login-controls'
import { resolveMediaUrl } from './logo-utils'

interface LoginCredentials {
	identifier: string
	password: string
}

interface HeaderProps {
	globalLayout?: GlobalLayout | null
	strapiBaseUrl?: string | null
	theme: ThemeDefinition
	isAuthenticated: boolean
	user: AuthUser | null
	onLogin: (credentials: LoginCredentials) => Promise<void>
	onLogout: () => void
	isAuthenticating: boolean
	error?: string | null
	pageTitle?: string | null
}

export function Header({
	globalLayout,
	strapiBaseUrl,
	theme,
	isAuthenticated,
	user,
	onLogin,
	onLogout,
	isAuthenticating,
	error,
	pageTitle,
}: HeaderProps) {

	const logoSrc = resolveMediaUrl(globalLayout?.Logo, strapiBaseUrl ?? '')
	const logoAlt = globalLayout?.Logo?.alternativeText ?? 'HZD Logo'
	const menuItems = globalLayout?.Menu?.items ?? []
	const logoWidth = 150
	const logoHeight = 150

	return (
		<header
			style={{
				backgroundColor: theme.headerBackground,
				color: theme.headerFooterTextColor,
			}}
			className='w-full'
		>
			<nav className='flex w-full items-center px-6 py-3'>
				<div className='flex flex-1 justify-center'>
					<Link
						href='/'
						className='flex items-center justify-center transition-opacity hover:opacity-80'
						aria-label='Zur Startseite'
					>
						{logoSrc ? (
							<Image
								src={logoSrc}
								alt={logoAlt}
								width={logoWidth}
								height={logoHeight}
								className='object-contain'
								unoptimized
								priority
								style={{ margin: 'auto' }}
							/>
						) : (
							<span className='text-lg font-semibold tracking-wide text-center'>
								HZD
							</span>
						)}
					</Link>
				</div>
				<div className='flex flex-1 justify-center'>
					<NavigationMenu
						menuItems={menuItems}
						theme={{
							textColor: theme.textColor,
							headerFooterTextColor: theme.headerFooterTextColor,
						}}
					/>
				</div>
				<div className='flex flex-1 items-center justify-center gap-4'>
					<SocialLinks
						socialLinkFB={globalLayout?.SocialLinkFB}
						socialLinkYT={globalLayout?.SocialLinkYT}
					/>
					<LoginControls
						isAuthenticated={isAuthenticated}
						user={user}
						onLogin={onLogin}
						onLogout={onLogout}
						isAuthenticating={isAuthenticating}
						error={error}
						theme={theme}
					/>
				</div>
			</nav>
			{pageTitle ? (
			<div className='flex w-full justify-end'>
				<span style={{ marginRight: '20vw', fontSize: '2em' }}>{pageTitle}</span>
			</div>) : null}
		</header>
	)
}

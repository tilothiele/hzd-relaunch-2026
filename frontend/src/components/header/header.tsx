import type { AuthUser, GlobalLayout } from '@/types'
import type { ThemeDefinition } from '@/themes'
import Image from 'next/image'
import Link from 'next/link'
import { NavigationMenu } from '@/components/ui/navigation-menu'
import { SocialLinks } from './social-links'
import { LoginControls } from './login-controls'
import { resolveMediaUrl } from './logo-utils'
import { DrawerMenuComponent } from './drawer-menu'
import { cn } from '@/lib/utils'

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
	const logoWidth = 80
	const logoHeight = 80

	const isStickyTransparent = globalLayout?.MenuStyle === 'StickyTransparent'
	const headerBg = isStickyTransparent
		? `color-mix(in srgb, ${theme.headerBackground}, transparent 20%)`
		: theme.headerBackground

	return (
		<header
			style={{
				backgroundColor: headerBg,
				color: theme.headerFooterTextColor,
			}}
			className={cn(
				'w-full transition-all duration-300',
				isStickyTransparent && 'sticky top-0 z-[100] backdrop-blur-md shadow-sm'
			)}
		>
			<nav className='header-nav-padding flex w-full items-center px-6 py-2'>
				{/* Left Section: Drawer + Logo */}
				<div className='flex flex-1 items-center justify-start gap-4 relative'>
					<DrawerMenuComponent
						drawerMenu={globalLayout?.DrawerMenu}
						theme={theme}
					/>
					<Link
						href='/'
						className='absolute -top-8 left-12 z-[110] flex items-center justify-center transition-opacity hover:opacity-80'
						aria-label='Zur Startseite'
					>
						{logoSrc ? (
							<Image
								src={logoSrc}
								alt={logoAlt}
								width={logoWidth}
								height={logoHeight}
								className='mb-1 h-[111px] w-[111px] object-contain md:h-[158px] md:w-[158px]'
								unoptimized
								priority
							/>
						) : (
							<span className='text-lg font-semibold tracking-wide text-center'>
								HZD
							</span>
						)}
					</Link>
				</div>

				{/* Center Section: Navigation Menu */}
				<div className='flex flex-1 justify-center'>
					<NavigationMenu
						menuItems={menuItems}
						theme={{
							textColor: theme.textColor,
							headerFooterTextColor: theme.headerFooterTextColor,
						}}
					/>
				</div>

				{/* Right Section: Social Links + Login */}
				<div className='flex flex-1 items-center justify-end gap-4'>
					<SocialLinks
						socialLinkFB={globalLayout?.SocialLinkFB}
						socialLinkYT={globalLayout?.SocialLinkYT}
						theme={theme}
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
					<span style={{ marginRight: '20vw', fontSize: '1.2em' }}>{pageTitle}</span>
				</div>
			) : null}
		</header>
	)
}

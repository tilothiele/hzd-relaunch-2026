import type { AuthUser, GlobalLayout } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { HeaderNavigation } from './header-navigation'
import { AnnouncementSlider } from './announcement-slider'

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
	logoBackground?: boolean | null
	announcements?: GlobalLayout['announcements']
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
	logoBackground,
	announcements,
}: HeaderProps) {
	const [isScrolled, setIsScrolled] = useState(false)

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50)
		}

		// Initial check
		handleScroll()

		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	const isStickyTransparent = globalLayout?.MenuStyle === 'StickyTransparent'
	const headerBg = isStickyTransparent
		? `color-mix(in srgb, ${theme.headerBackground}, transparent 20%)`
		: theme.headerBackground

	return (
		<>
			{announcements && announcements.length > 0 && (
				<AnnouncementSlider announcements={announcements} theme={theme} />
			)}
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
				<HeaderNavigation
					globalLayout={globalLayout}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
					isAuthenticated={isAuthenticated}
					user={user}
					onLogin={onLogin}
					onLogout={onLogout}
					isAuthenticating={isAuthenticating}
					error={error}
					isScrolled={isScrolled}
					logoBackground={logoBackground}
				/>
			</header>
		</>
	)
}

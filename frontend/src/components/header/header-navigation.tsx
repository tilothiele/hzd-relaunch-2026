'use client'

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
import HomeIcon from '@mui/icons-material/Home'

interface LoginCredentials {
    identifier: string
    password: string
}

interface HeaderNavigationProps {
    globalLayout?: GlobalLayout | null
    strapiBaseUrl?: string | null
    theme: ThemeDefinition
    isAuthenticated: boolean
    user: AuthUser | null
    onLogin: (credentials: LoginCredentials) => Promise<void>
    onLogout: () => void
    isAuthenticating: boolean
    error?: string | null
    isScrolled: boolean
    logoBackground?: boolean | null
}

export function HeaderNavigation({
    globalLayout,
    strapiBaseUrl,
    theme,
    isAuthenticated,
    user,
    onLogin,
    onLogout,
    isAuthenticating,
    error,
    isScrolled,
    logoBackground,
}: HeaderNavigationProps) {
    const logoSrc = resolveMediaUrl(globalLayout?.Logo, strapiBaseUrl ?? '')
    const logoAlt = globalLayout?.Logo?.alternativeText ?? 'HZD Logo'
    const menuItems = globalLayout?.Menu?.items ?? []
    const logoWidth = 80
    const logoHeight = 80

    // Logo Background Logic
    const logoContainerStyle = logoBackground ? {
        backgroundColor: 'var(--color-logo-background-face)',
        padding: isScrolled ? '6px 12px' : '15px 30px',
        borderRadius: '0',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    } : {}

    const logoContainerClass = logoBackground
        ? 'transition-all duration-500 ease-in-out'
        : ''

    return (
        <nav className='header-nav-padding flex w-full items-center px-6 py-2'>
            {/* Left Section: Drawer + Logo */}
            <div className='flex flex-1 items-center justify-start gap-4 relative'>
                <DrawerMenuComponent
                    drawerMenu={globalLayout?.DrawerMenu}
                    theme={theme}
                    user={user}
                />

                {/* Desktop Logo */}
                <Link
                    href='/'
                    className={cn(
                        'absolute -top-8 left-12 z-[110] hidden md:flex items-center justify-center transition-opacity hover:opacity-80',
                    )}
                    aria-label='Zur Startseite'
                >
                    <div
                        style={logoContainerStyle}
                        className={cn('flex items-center justify-center', logoContainerClass)}
                    >
                        {logoSrc ? (
                            <Image
                                src={logoSrc}
                                alt={logoAlt}
                                width={logoWidth}
                                height={logoHeight}
                                className={cn(
                                    'mb-1 object-contain transition-all duration-500 ease-in-out',
                                    isScrolled ? 'h-[63px] w-[63px]' : 'h-[158px] w-[158px]'
                                )}
                                unoptimized
                                priority
                            />
                        ) : (
                            <span className='text-lg font-semibold tracking-wide text-center'>
                                HZD
                            </span>
                        )}
                    </div>
                </Link>

                {/* Mobile Logo / Home Icon */}
                <Link
                    href='/'
                    className={cn(
                        'absolute z-[110] flex md:hidden items-center justify-center transition-all duration-300 hover:opacity-80',
                        isScrolled
                            ? 'top-1/2 -translate-y-1/2 left-10'
                            : 'max-[500px]:top-1/2 max-[500px]:-translate-y-1/2 max-[500px]:left-10 -top-8 left-12'
                    )}
                    aria-label='Zur Startseite'
                >
                    {/* Show Logo when NOT scrolled AND width >= 500px */}
                    <div className={cn(
                        'transition-opacity duration-300',
                        isScrolled
                            ? 'opacity-0 pointer-events-none absolute'
                            : 'opacity-100 max-[500px]:opacity-0 max-[500px]:pointer-events-none max-[500px]:absolute'
                    )}>
                        <div
                            style={logoContainerStyle}
                            className={cn('flex items-center justify-center', logoContainerClass)}
                        >
                            {logoSrc ? (
                                <Image
                                    src={logoSrc}
                                    alt={logoAlt}
                                    width={logoWidth}
                                    height={logoHeight}
                                    className='mb-1 h-[111px] w-[111px] object-contain'
                                    unoptimized
                                    priority
                                />
                            ) : (
                                <span className='text-lg font-semibold tracking-wide text-center'>
                                    HZD
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Show Home Icon when scrolled OR width < 500px */}
                    <div className={cn(
                        'transition-opacity duration-300',
                        isScrolled
                            ? 'opacity-100'
                            : 'opacity-0 pointer-events-none absolute max-[500px]:opacity-100 max-[500px]:static max-[500px]:pointer-events-auto'
                    )}>
                        <HomeIcon sx={{ fontSize: 32, color: theme.headerFooterTextColor }} />
                    </div>
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
                {globalLayout?.SOS?.ShowSOS && (
                    <Link
                        href={globalLayout.SOS.SosLink ?? '#'}
                        title={globalLayout.SOS.SosTitle ?? 'SOS'}
                        className='flex items-center justify-center rounded-[16px] px-3 h-6 text-sm font-bold shadow-sm animate-pulse'
                        style={{
                            backgroundColor: theme.submitButtonColor,
                            color: theme.submitButtonTextColor,
                        }}
                    >
                        SOS
                    </Link>
                )}
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
    )
}

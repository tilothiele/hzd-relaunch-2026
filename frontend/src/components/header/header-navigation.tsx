'use client'

import { useState, useEffect } from 'react'
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
import FacebookShare from '@/components/ui/facebook-share-1'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faCalendar } from '@fortawesome/free-solid-svg-icons'

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
    const [currentUrl, setCurrentUrl] = useState<string>('')
    const [isNotificationActive, setIsNotificationActive] = useState<boolean>(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href)

            // Check if push notifications are active
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.pushManager.getSubscription().then(sub => {
                        setIsNotificationActive(!!sub)
                    }).catch(() => setIsNotificationActive(false))
                }).catch(() => setIsNotificationActive(false))
            } else {
                // If PushManager is not supported (e.g. on iOS Safari not in standalone)
                // we keep it as false to show the prompt icon
                setIsNotificationActive(false)
            }
        }
    }, [])

    const logoSrc = resolveMediaUrl(globalLayout?.Logo, strapiBaseUrl ?? '')
    const logoAlt = globalLayout?.Logo?.alternativeText ?? 'HZD Logo'
    const menuItems = globalLayout?.Menu?.items ?? []

    // Logo Sizing Logic
    // Base: 158px (100%)
    // Mobile Base: 50% (79px)
    // Absolute Min: 30% (47.4px)
    // Desktop Scrolled: 40% (63.2px) -> existing was 63px

    const logoBaseSize = 158
    const logoMinSize = logoBaseSize * 0.3 // 47.4px

    // We use a CSS variable for the logo size to handle fluid scaling and scroll state smoothly
    // Scaling from 158px (100%) down to 47.4px (30%) at 1000px width
    // Formula: size = 0.25 * width - 203px (hits ~158 at 1440 and ~47 at 1000)
    const logoSizeStyle = {
        '--logo-size': isScrolled
            ? `${logoMinSize}px` // Min size when scrolled
            : `clamp(${logoMinSize}px, calc(0.25 * 100vw - 203px), ${logoBaseSize}px)`,
    } as React.CSSProperties

    // Logo Background Logic
    const logoContainerStyle = {
        ...(logoBackground ? {
            backgroundColor: 'var(--color-logo-background-face)',
            padding: isScrolled ? '6px 12px' : '15px 30px',
            borderRadius: '0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        } : {}),
        ...logoSizeStyle
    }

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

                {/* Unified Logo */}
                <Link
                    href='/'
                    className={cn(
                        'absolute z-[110] flex items-center justify-center transition-all duration-500 ease-in-out hover:opacity-80',
                        isScrolled
                            ? 'top-1/2 -translate-y-1/2 left-10 md:left-12'
                            : '-top-8 left-12'
                    )}
                    aria-label='Zur Startseite'
                >
                    {/* Logo Image */}
                    <div className='transition-all duration-500 ease-in-out opacity-100'>
                        <div
                            style={logoContainerStyle}
                            className={cn('flex items-center justify-center', logoContainerClass)}
                        >
                            {logoSrc ? (
                                <Image
                                    src={logoSrc}
                                    alt={logoAlt}
                                    width={logoBaseSize}
                                    height={logoBaseSize}
                                    style={{
                                        // Use mobile size if < 768px (md breakpoint)
                                        height: 'var(--logo-size)',
                                        width: 'var(--logo-size)',
                                    }}
                                    className='mb-1 object-contain transition-all duration-500 ease-in-out'
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
                </Link>
            </div>

            {/* Right Section: Navigation Menu + Utilities */}
            <div className='flex items-center justify-end gap-2 md:gap-4' style={{ color: theme.headerFooterIcons }}>
                <NavigationMenu
                    menuItems={menuItems}
                    theme={{
                        textColor: theme.textColor,
                        headerFooterTextColor: theme.headerFooterTextColor,
                    }}
                />

                {currentUrl && <FacebookShare url={currentUrl} />}

                <Link
                    href='/calendar'
                    title='Veranstaltungskalender'
                    className='flex items-center justify-center transition-transform hover:scale-110'
                >
                    <FontAwesomeIcon
                        icon={faCalendar}
                        className='text-[20px] md:text-[24px]' // Using font-size for responsiveness
                        style={{ color: theme.headerFooterIcons }}
                    />
                </Link>

                {!isNotificationActive && (
                    <Link
                        href='/notification-settings'
                        title='Benachrichtigungen hier aktivieren'
                        className='flex items-center justify-center transition-transform hover:scale-110'
                    >
                        <FontAwesomeIcon
                            icon={faBell}
                            className='text-[20px] md:text-[24px]' // Using font-size for responsiveness
                            style={{ color: '#ff0000' }}
                        />
                    </Link>
                )}

                <div className='hidden md:flex items-center gap-4'>
                    <SocialLinks
                        socialLinkFB={globalLayout?.SocialLinkFB}
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
                </div>

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

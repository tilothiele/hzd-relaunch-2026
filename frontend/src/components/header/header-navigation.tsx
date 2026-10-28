'use client'

import { useEffect, useRef, useState } from 'react'
import type { AuthUser, GlobalLayout } from '@/types'
import type { ThemeDefinition } from '@/themes'
import Image from 'next/image'
import Link from 'next/link'
import { NavigationMenu } from '@/components/ui/navigation-menu'
import { LoginControls } from './login-controls'
import { resolveMediaUrl } from './logo-utils'
import { DrawerMenuComponent } from './drawer-menu'
import { cn } from '@/lib/utils'
import FacebookShare from '@/components/ui/facebook-share-1'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faCalendar } from '@fortawesome/free-solid-svg-icons'
import { HeaderSearch } from '@/components/search/header-search'
import { useSearchEnabled } from '@/components/search/search-config-context'

interface HeaderNavigationProps {
    globalLayout?: GlobalLayout | null
    strapiBaseUrl?: string | null
    theme: ThemeDefinition
    isAuthenticated: boolean
    user: AuthUser | null
    onLogin: () => Promise<void>
    onLogout: () => Promise<void>
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
    const [headerRowHeight, setHeaderRowHeight] = useState(0)
    const headerRowRef = useRef<HTMLElement>(null)
    const searchEnabled = useSearchEnabled()

    useEffect(() => {
        const headerRow = headerRowRef.current
        if (!headerRow) {
            return
        }

        const updateHeaderRowHeight = () => {
            const nextHeight = headerRow.getBoundingClientRect().height
            setHeaderRowHeight((current) => (
                Math.abs(current - nextHeight) < 0.5 ? current : nextHeight
            ))
        }

        updateHeaderRowHeight()
        const observer = new ResizeObserver(updateHeaderRowHeight)
        observer.observe(headerRow)

        return () => {
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            queueMicrotask(() => {
                setCurrentUrl(window.location.href)
            })

            // Check if push notifications are active
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.pushManager.getSubscription().then(sub => {
                        setIsNotificationActive(!!sub)
                    }).catch(() => setIsNotificationActive(false))
                }).catch(() => setIsNotificationActive(false))
            }
        }
    }, [])

    const logoSrc = resolveMediaUrl(globalLayout?.Logo, strapiBaseUrl ?? '')
    const logoAlt = globalLayout?.Logo?.alternativeText ?? 'HZD Logo'
    const menuItems = globalLayout?.Menu?.items ?? []

    // Logo: 158px auf breiten Viewports, Formel trifft ~158px bei 1440px.
    // Untergrenze ist 70% der Headerzeile, damit das Zeichen nicht
    // schneller schrumpft als die quadratische Fläche.
    const logoBaseSize = 158
    const logoFloor = Math.max(logoBaseSize * 0.3, headerRowHeight * 0.7)
    const logoFloorPx = Math.round(logoFloor * 10) / 10
    const logoSize = isScrolled
        ? `${logoFloorPx}px`
        : `clamp(${logoFloorPx}px, calc(0.25 * 100vw - 203px), ${logoBaseSize}px)`

    // Linker Abstand: auf schmalen Viewports näher am Rand, auf breiten etwas Luft.
    const logoLeft = isScrolled
        ? 'clamp(0.25rem, 0.8vw + 0.15rem, 2rem)'
        : 'clamp(0.15rem, 1.2vw + 0.1rem, 2.25rem)'

    const logoSizeStyle = {
        '--logo-size': logoSize,
        width: 'var(--logo-size)',
        height: 'var(--logo-size)',
        minWidth: 'var(--logo-size)',
        minHeight: 'var(--logo-size)',
        aspectRatio: '1 / 1',
        boxSizing: 'content-box',
        flexShrink: 0,
    } as React.CSSProperties

    // Logo Background Logic
    // Padding skaliert mit dem Logo, damit Zeichen und Fläche
    // bei schmalerer Breite im gleichen Verhältnis bleiben.
    const logoContainerStyle = {
        ...(logoBackground ? {
            backgroundColor: 'var(--color-logo-background-face)',
            padding: 'calc(var(--logo-size) * 0.12)',
            borderRadius: '0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        } : {}),
        ...logoSizeStyle
    }

    const logoContainerClass = logoBackground
        ? 'transition-all duration-500 ease-in-out'
        : ''

    return (
        <nav
            ref={headerRowRef}
            className='header-nav-padding flex w-full items-center px-6 py-2'
        >
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
                        'header-logo-link absolute z-[110] flex items-center justify-center transition-all duration-500 ease-in-out hover:opacity-80',
                        isScrolled
                            ? 'top-1/2 -translate-y-1/2'
                            : '-top-8'
                    )}
                    style={{ left: logoLeft }}
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
                                        display: 'block',
                                        height: '100%',
                                        width: '100%',
                                        maxWidth: 'none',
                                        maxHeight: 'none',
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

                {searchEnabled ? (
                    <HeaderSearch iconColor={theme.headerFooterIcons} />
                ) : null}

                <Link
                    href='/calendar'
                    title='Veranstaltungen'
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

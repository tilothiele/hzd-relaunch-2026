'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faRightFromBracket, faSpinner } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AuthUser } from '@/types'
import type { ThemeDefinition } from '@/themes'

interface LoginControlsProps {
	isAuthenticated: boolean
	user: AuthUser | null
	onLogin: () => Promise<void>
	onLogout: () => Promise<void>
	isAuthenticating: boolean
	error?: string | null
	theme: ThemeDefinition
}

export function LoginControls({
	isAuthenticated,
	user,
	onLogin,
	onLogout,
	isAuthenticating,
	error,
	theme,
}: LoginControlsProps) {
	const router = useRouter()
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const userLabel = useMemo(() => {
		if (!user) {
			return 'Login'
		}

		// Verwende firstName + lastName falls vorhanden
		if (user.firstName || user.lastName) {
			const nameParts = [user.firstName, user.lastName].filter(Boolean)
			if (nameParts.length > 0) {
				return nameParts.join(' ')
			}
		}

		// Fallback auf username oder email
		return user.username ?? user.email ?? 'Account'
	}, [user])

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false)
			}
		}

		if (isMenuOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isMenuOpen])

	const handleLogin = useCallback(async () => {
		await onLogin()
	}, [onLogin])

	const handleLogout = useCallback(async () => {
		setIsMenuOpen(false)
		await onLogout()
		router.refresh()
	}, [onLogout, router])

	const clearCloseTimeout = useCallback(() => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current)
			closeTimeoutRef.current = null
		}
	}, [])

	const handleMouseEnter = useCallback(() => {
		clearCloseTimeout()
		setIsMenuOpen(true)
	}, [clearCloseTimeout])

	const handleMouseLeave = useCallback(() => {
		clearCloseTimeout()
		closeTimeoutRef.current = setTimeout(() => {
			setIsMenuOpen(false)
			closeTimeoutRef.current = null
		}, 300)
	}, [clearCloseTimeout])

	if (isAuthenticated) {
		return (
			<div className='relative' ref={menuRef}>
				<div
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					className='flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-white/10'
					aria-label='Benutzermenü'
					aria-controls='user-menu'
					aria-haspopup='true'
					aria-expanded={isMenuOpen}
				>
					<FontAwesomeIcon
						icon={faUser}
						style={{ fontSize: '1.2em', color: theme.loginIcon }}
					/>
					<span style={{ fontSize: '1.2em', color: theme.headerFooterTextColor, fontWeight: 400 }}>
						{userLabel}
					</span>
				</div>

				{isMenuOpen && (
					<div
						id='user-menu'
						className='absolute right-0 z-50 mt-2 min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg'
						onMouseEnter={handleMouseEnter}
						onMouseLeave={handleMouseLeave}
					>
						<Link
							href='/meine-hzd'
							className='block px-4 py-3 text-gray-900 transition-colors hover:bg-yellow-50 hover:text-yellow-500'
							onClick={() => setIsMenuOpen(false)}
						>
							Meine HZD
						</Link>
						<button
							onClick={handleLogout}
							className='flex w-full items-center gap-2 px-4 py-3 text-left text-gray-900 transition-colors hover:bg-yellow-50 hover:text-yellow-500'
						>
							<FontAwesomeIcon icon={faRightFromBracket} className='text-sm' />
							Logout
						</button>
					</div>
				)}
			</div>
		)
	}

	return (
		<div className='relative'>
			<button
				type='button'
				onClick={handleLogin}
				className='flex items-center gap-2 transition-colors hover:text-yellow-400'
				style={{ color: theme.headerFooterTextColor, fontSize: '1.2em', fontWeight: 400 }}
				title={error ?? 'Mit Authentik anmelden'}
				disabled={isAuthenticating}
			>
				<FontAwesomeIcon icon={faUser} style={{ color: theme.headerFooterTextColor, fontSize: '1.2em' }} />
				{isAuthenticating ? (
					<span className='flex items-center gap-2'>
						<FontAwesomeIcon icon={faSpinner} spin />
						Laden
					</span>
				) : (
					<span style={{ color: theme.headerFooterTextColor }}>{userLabel}</span>
				)}
			</button>
		</div>
	)
}

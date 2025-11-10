'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MenuItem, Startpage, AuthUser } from '@/types'
import type { ThemeDefinition } from '@/themes'
import Image from 'next/image'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faRightFromBracket, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { SocialLinks } from './social-links'
import { resolveMediaUrl } from './logo-utils'

const baseLinkClass =
	'flex items-center gap-1 transition-colors hover:text-yellow-400'

interface LoginCredentials {
	identifier: string
	password: string
}

interface LoginControlsProps {
	isAuthenticated: boolean
	user: AuthUser | null
	onLogin: (credentials: LoginCredentials) => Promise<void>
	onLogout: () => void
	isAuthenticating: boolean
	error?: string | null
	theme: ThemeDefinition
}

interface HeaderProps {
	startpage: Startpage
	strapiBaseUrl: string
	theme: ThemeDefinition
	isAuthenticated: boolean
	user: AuthUser | null
	onLogin: (credentials: LoginCredentials) => Promise<void>
	onLogout: () => void
	isAuthenticating: boolean
	error?: string | null
}

interface MenuItemComponentProps {
	item: MenuItem
	theme: ThemeDefinition
}

function MenuItemComponent({ item, theme }: MenuItemComponentProps) {
	const hasChildren = Boolean(item.children?.length)
	const key = item.url ?? item.name
	const [isOpen, setIsOpen] = useState(false)

	const openMenu = useCallback(() => {
		setIsOpen(true)
	}, [])

	const closeMenu = useCallback(() => {
		setIsOpen(false)
	}, [])

	const toggleMenu = useCallback(() => {
		setIsOpen((previousOpen: boolean) => !previousOpen)
	}, [])

	const handleLinkClick = useCallback(() => {
		closeMenu()
	}, [closeMenu])

	const dropdownClass = [
		'absolute',
		'left-0',
		'top-full',
		'z-20',
		'w-48',
		'rounded',
		'py-2',
		'shadow-lg',
		isOpen ? 'block' : 'hidden',
	].join(' ')

	return (
		<li
			key={key}
			className={hasChildren ? 'relative' : undefined}
			onMouseEnter={hasChildren ? openMenu : undefined}
			onMouseLeave={hasChildren ? closeMenu : undefined}
			onFocus={hasChildren ? openMenu : undefined}
			onBlur={hasChildren ? closeMenu : undefined}
		>
			<div className='flex items-center gap-2'>
				{item.url ? (
					<Link
						href={item.url}
						className={baseLinkClass}
						onClick={handleLinkClick}
					>
						{item.name}
					</Link>
				) : (
					<span className={baseLinkClass}>
						{item.name}
					</span>
				)}
				{hasChildren ? (
					<button
						type='button'
						onClick={toggleMenu}
						className='text-xs transition-colors hover:text-yellow-400 focus:outline-none'
						aria-expanded={isOpen}
						aria-label={`${item.name} Untermenü ${
							isOpen ? 'schließen' : 'öffnen'
						}`}
					>
						<span aria-hidden='true'>
							{isOpen ? '▲' : '▼'}
						</span>
					</button>
				) : null}
			</div>
			{hasChildren ? (
				<ul
					className={dropdownClass}
					style={{
						backgroundColor: theme.headerBackground,
						color: theme.headerFooterTextColor,
					}}
				>
					{item.children?.map((child) => (
						<MenuItemComponent
							key={child.url ?? child.name}
							item={child}
							theme={theme}
						/>
					))}
				</ul>
			) : null}
		</li>
	)
}

function LoginControls({
	isAuthenticated,
	user,
	onLogin,
	onLogout,
	isAuthenticating,
	error,
	theme,
}: LoginControlsProps) {
	const [isFormVisible, setIsFormVisible] = useState(false)
	const [identifier, setIdentifier] = useState('')
	const [password, setPassword] = useState('')
	const [localError, setLocalError] = useState<string | null>(null)

	const userLabel = useMemo(() => {
		if (!user) {
			return 'Login'
		}

		return user.username ?? user.email ?? 'Account'
	}, [user])

	useEffect(() => {
		if (isAuthenticated) {
			setIsFormVisible(false)
			setIdentifier('')
			setPassword('')
		}
	}, [isAuthenticated])

	useEffect(() => {
		setLocalError(error ?? null)
	}, [error])

	const toggleFormVisibility = useCallback(() => {
		setIsFormVisible((previousVisible: boolean) => !previousVisible)
	}, [])

	const handleLogout = useCallback(() => {
		setIsFormVisible(false)
		onLogout()
	}, [onLogout])

	const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setLocalError(null)

		try {
			await onLogin({ identifier, password })
		} catch (submissionError) {
			if (submissionError instanceof Error && submissionError.message) {
				setLocalError(submissionError.message)
			} else {
				setLocalError('Login fehlgeschlagen. Bitte versuchen Sie es erneut.')
			}
		} finally {
			setPassword('')
		}
	}, [identifier, onLogin, password])

	if (isAuthenticated) {
		return (
			<div className='flex items-center gap-3'>
				<span className='flex items-center gap-2 text-sm'>
					<FontAwesomeIcon icon={faUser} />
					{userLabel}
				</span>
				<button
					type='button'
					onClick={handleLogout}
					className='flex items-center gap-2 text-sm transition-colors hover:text-yellow-400'
				>
					<FontAwesomeIcon icon={faRightFromBracket} />
					Logout
				</button>
			</div>
		)
	}

	return (
		<div className='relative'>
			<button
				type='button'
				onClick={toggleFormVisibility}
				className='flex items-center gap-2 text-sm transition-colors hover:text-yellow-400'
				aria-expanded={isFormVisible}
				aria-controls='login-form'
			>
				<FontAwesomeIcon icon={faUser} />
				{isAuthenticating ? (
					<span className='flex items-center gap-2'>
						<FontAwesomeIcon icon={faSpinner} spin />
						Laden
					</span>
				) : (
					<span>{userLabel}</span>
				)}
			</button>
			{isFormVisible ? (
				<form
					id='login-form'
					onSubmit={handleSubmit}
					className='absolute right-0 mt-2 w-64 rounded bg-white p-4 text-gray-900 shadow-lg'
				>
					<label className='mb-2 block text-sm font-medium text-gray-700'>
						E-Mail oder Benutzername
						<input
							type='text'
							name='identifier'
							value={identifier}
							onChange={(event: ChangeEvent<HTMLInputElement>) => setIdentifier(event.target.value)}
							className='mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
							autoComplete='username'
							required
						/>
					</label>
					<label className='mb-2 block text-sm font-medium text-gray-700'>
						Passwort
						<input
							type='password'
							name='password'
							value={password}
							onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
							className='mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
							autoComplete='current-password'
							required
						/>
					</label>
					{localError ? (
						<p className='mb-2 text-sm text-red-600'>
							{localError}
						</p>
					) : null}
					<button
						type='submit'
						className='flex w-full items-center justify-center gap-2 rounded px-3 py-2 text-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
						style={{
							backgroundColor: theme.headerBackground,
							color: theme.headerFooterTextColor,
						}}
						disabled={isAuthenticating}
					>
						{isAuthenticating ? (
							<>
								<FontAwesomeIcon icon={faSpinner} spin />
								Anmeldung läuft
							</>
						) : (
							'Einloggen'
						)}
					</button>
				</form>
			) : null}
		</div>
	)
}

export function Header({
	startpage,
	strapiBaseUrl,
	theme,
	isAuthenticated,
	user,
	onLogin,
	onLogout,
	isAuthenticating,
	error,
}: HeaderProps) {
	const logoSrc = resolveMediaUrl(startpage?.Logo, strapiBaseUrl ?? '')
	const logoAlt = startpage?.Logo?.alternativeText ?? 'HZD Logo'
	const menuItems = startpage.Menu?.items ?? []

	console.log(strapiBaseUrl, logoSrc)

	return (
		<header
			style={{
				backgroundColor: theme.headerBackground,
				color: theme.headerFooterTextColor,
			}}
		>
			<nav className='container mx-auto flex items-center px-4 py-3'>
				<div className='flex flex-1 justify-start'>
					<Link
						href='/'
						className='flex items-center transition-opacity hover:opacity-80'
						aria-label='Zur Startseite'
					>
						{logoSrc ? (
							<Image
								src={logoSrc}
								alt={logoAlt}
								width={150}
								height={150}
								className='object-contain'
								unoptimized
								priority
							/>
						) : (
							<span className='text-lg font-semibold tracking-wide'>
								HZD
							</span>
						)}
					</Link>
				</div>
					<ul className='flex flex-1 items-center justify-center gap-6 text-base'>
						{menuItems.map((item) => (
							<MenuItemComponent
								key={item.url ?? item.name}
								item={item}
								theme={theme}
							/>
						))}
				</ul>
				<div className='flex flex-1 items-center justify-end gap-4'>
					<SocialLinks
						socialLinkFB={startpage.SocialLinkFB}
						socialLinkYT={startpage.SocialLinkYT}
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
		</header>
	)
}

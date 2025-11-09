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

const dropdownListClass = [
	'absolute',
	'left-0',
	'top-full',
	'z-20',
	'hidden',
	'w-40',
	'rounded',
	'py-2',
	'shadow-lg',
	'group-hover:block',
	'group-focus-within:block',
].join(' ')

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

function renderMenuItem(item: MenuItem, theme: ThemeDefinition) {
	const hasChildren = Boolean(item.children?.length)
	const key = item.url ?? item.name

	return (
		<li
			key={key}
			className={hasChildren ? 'relative group' : undefined}
		>
			{item.url ? (
				<Link href={item.url} className={baseLinkClass}>
					{item.name}
					{hasChildren ? (
						<span className='text-xs' aria-hidden='true'>
							▼
						</span>
					) : null}
				</Link>
			) : (
				<span className={baseLinkClass}>
					{item.name}
					{hasChildren ? (
						<span className='text-xs' aria-hidden='true'>
							▼
						</span>
					) : null}
				</span>
			)}
			{hasChildren ? (
				<ul
					className={dropdownListClass}
					style={{ backgroundColor: theme.headerBackground }}
				>
					{item.children?.map((child) => renderMenuItem(child, theme))}
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
						className='flex w-full items-center justify-center gap-2 rounded px-3 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
						style={{ backgroundColor: theme.headerBackground }}
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
			className='text-white'
			style={{ backgroundColor: theme.headerBackground }}
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
								className='h-30 w-auto object-contain'
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
						{menuItems.map((item) => renderMenuItem(item, theme))}
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

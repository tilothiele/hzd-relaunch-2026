'use client'

import { useCallback, useEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faRightFromBracket, faSpinner } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import type { AuthUser } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { fetchGraphQL } from '@/lib/graphql-client'
import { REGISTER_USER, FORGOT_PASSWORD } from '@/lib/graphql/queries'

interface LoginControlsProps {
	isAuthenticated: boolean
	user: AuthUser | null
	onLogin: (credentials: { identifier: string; password: string }) => Promise<void>
	onLogout: () => void
	isAuthenticating: boolean
	error?: string | null
	theme: ThemeDefinition
}

interface LoginCredentials {
	identifier: string
	password: string
}

type TabValue = 'login' | 'register' | 'forgot-password'

export function LoginControls({
	isAuthenticated,
	user,
	onLogin,
	onLogout,
	isAuthenticating,
	error,
	theme,
}: LoginControlsProps) {
	const [isFormVisible, setIsFormVisible] = useState(false)
	const [activeTab, setActiveTab] = useState<TabValue>('login')
	const [identifier, setIdentifier] = useState('')
	const [email, setEmail] = useState('')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [localError, setLocalError] = useState<string | null>(null)
	const [localSuccess, setLocalSuccess] = useState<string | null>(null)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isRegistering, setIsRegistering] = useState(false)
	const [isSendingReset, setIsSendingReset] = useState(false)
	const [hoveredButton, setHoveredButton] = useState<string | null>(null)

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

	useEffect(() => {
		if (isAuthenticated) {
			setIsFormVisible(false)
			setIdentifier('')
			setPassword('')
			setEmail('')
			setUsername('')
			setConfirmPassword('')
			setActiveTab('login')
		}
	}, [isAuthenticated])

	useEffect(() => {
		setLocalError(error ?? null)
	}, [error])

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

	const toggleFormVisibility = useCallback(() => {
		setIsFormVisible((previousVisible: boolean) => {
			if (!previousVisible) {
				setActiveTab('login')
				setLocalError(null)
				setLocalSuccess(null)
			}
			return !previousVisible
		})
	}, [])

	const handleTabChange = useCallback((newValue: TabValue) => {
		setActiveTab(newValue)
		setLocalError(null)
		setLocalSuccess(null)
		setIdentifier('')
		setEmail('')
		setUsername('')
		setPassword('')
		setConfirmPassword('')
	}, [])

	const handleLogout = useCallback(() => {
		setIsFormVisible(false)
		setIsMenuOpen(false)
		onLogout()
	}, [onLogout])

	const handleLoginSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setLocalError(null)
		setLocalSuccess(null)

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



	const handleForgotPasswordSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setLocalError(null)
		setLocalSuccess(null)

		if (!email) {
			setLocalError('Bitte geben Sie Ihre E-Mail-Adresse ein.')
			return
		}

		setIsSendingReset(true)

		try {
			const result = await fetchGraphQL<{ forgotPassword: { ok: boolean } }>(
				FORGOT_PASSWORD,
				{
					variables: {
						email,
					},
				},
			)

			if (result.forgotPassword?.ok) {
				setLocalSuccess('Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet.')
				setEmail('')
			}
		} catch (submissionError) {
			if (submissionError instanceof Error && submissionError.message) {
				setLocalError(submissionError.message)
			} else {
				setLocalError('Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.')
			}
		} finally {
			setIsSendingReset(false)
		}
	}, [email])

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
						style={{ fontSize: '1.3rem', color: theme.loginIcon }}
					/>
					<span style={{ fontSize: '1.2rem', color: theme.headerFooterTextColor }}>
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
				onClick={toggleFormVisibility}
				className='flex items-center gap-2 transition-colors hover:text-yellow-400'
				style={{ color: theme.headerFooterTextColor, fontSize: '1.4rem' }}
				aria-expanded={isFormVisible}
				aria-controls='login-form'
			>
				<FontAwesomeIcon icon={faUser} style={{ color: theme.headerFooterTextColor, fontSize: '1.4rem' }} />
				{isAuthenticating ? (
					<span className='flex items-center gap-2'>
						<FontAwesomeIcon icon={faSpinner} spin />
						Laden
					</span>
				) : (
					<span style={{ color: theme.headerFooterTextColor }}>{userLabel}</span>
				)}
			</button>

			{isFormVisible && (
				<div
					className='absolute right-4 z-50 mt-3 w-full max-w-[400px] rounded-lg border border-gray-200 bg-white text-gray-900 shadow-xl'
					style={{ width: 'min(400px, calc(100vw - 32px))' }}
				>
					{/* Tabs */}
					<div className='border-b border-gray-200'>
						<div className='flex'>
							<button
								onClick={() => handleTabChange('login')}
								className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'login'
									? 'border-b-2 border-yellow-400 text-yellow-600'
									: 'text-gray-600 hover:text-gray-900'
									}`}
							>
								Anmeldung
							</button>
							<button
								onClick={() => handleTabChange('register')}
								className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'register'
									? 'border-b-2 border-yellow-400 text-yellow-600'
									: 'text-gray-600 hover:text-gray-900'
									}`}
							>
								Registrieren
							</button>
							<button
								onClick={() => handleTabChange('forgot-password')}
								className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'forgot-password'
									? 'border-b-2 border-yellow-400 text-yellow-600'
									: 'text-gray-600 hover:text-gray-900'
									}`}
							>
								Passwort vergessen
							</button>
						</div>
					</div>

					{/* Login Tab */}
					{activeTab === 'login' && (
						<form id='login-form' onSubmit={handleLoginSubmit} className='p-6'>
							<div className='flex flex-col gap-5'>
								<label className='block text-sm font-medium text-gray-700'>
									<span className='mb-2 block'>E-Mail oder HZD-Mitgliedsnummer</span>
									<input
										type='text'
										name='identifier'
										value={identifier}
										onChange={(event: ChangeEvent<HTMLInputElement>) =>
											setIdentifier(event.target.value)
										}
										className='w-full rounded-md border border-gray-300 bg-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										autoComplete='username'
										required
									/>
								</label>

								<label className='block text-sm font-medium text-gray-700'>
									<span className='mb-2 block'>Passwort</span>
									<input
										type='password'
										name='password'
										value={password}
										onChange={(event: ChangeEvent<HTMLInputElement>) =>
											setPassword(event.target.value)
										}
										className='w-full rounded-md border border-gray-300 bg-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										autoComplete='current-password'
										required
									/>
								</label>

								{localError && (
									<div className='rounded-md bg-red-50 p-3'>
										<p className='text-sm text-red-800'>{localError}</p>
									</div>
								)}

								{localSuccess && (
									<div className='rounded-md bg-green-50 p-3'>
										<p className='text-sm text-green-800'>{localSuccess}</p>
									</div>
								)}

								<button
									type='submit'
									className='mt-2 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60'
									style={{
										backgroundColor: theme.submitButtonColor,
										color: theme.submitButtonTextColor,
										filter: hoveredButton === 'login' ? 'brightness(90%)' : 'none',
									}}
									onMouseEnter={() => setHoveredButton('login')}
									onMouseLeave={() => setHoveredButton(null)}
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
							</div>
						</form>
					)}

					{/* Register Tab */}
					{activeTab === 'register' && (
						<div className='p-6'>
							<h2 className='mb-4 text-lg font-bold text-gray-900'>Registrieren</h2>
							<p className='mb-4 text-sm text-gray-600'>
								Ihr Benutzerprofil wird automatisch erstellt, nachdem Ihre Mitgliedschaft
								bestätigt wurde.
							</p>
							<p className='text-sm text-gray-600'>
								Sollten Sie Fragen haben oder Probleme beim Registrieren haben, wenden Sie
								sich bitte an unseren Support.
							</p>
						</div>
					)}

					{/* Forgot Password Tab */}
					{activeTab === 'forgot-password' && (
						<form
							id='forgot-password-form'
							onSubmit={handleForgotPasswordSubmit}
							className='p-6'
						>
							<div className='flex flex-col gap-5'>
								<p className='mb-2 text-sm text-gray-600'>
									Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum
									Zurücksetzen Ihres Passworts.
								</p>

								<label className='block text-sm font-medium text-gray-700'>
									<span className='mb-2 block'>E-Mail</span>
									<input
										type='email'
										name='email'
										value={email}
										onChange={(event: ChangeEvent<HTMLInputElement>) =>
											setEmail(event.target.value)
										}
										className='w-full rounded-md border border-gray-300 bg-gray-200 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										autoComplete='email'
										required
									/>
								</label>

								{localError && (
									<div className='rounded-md bg-red-50 p-3'>
										<p className='text-sm text-red-800'>{localError}</p>
									</div>
								)}

								{localSuccess && (
									<div className='rounded-md bg-green-50 p-3'>
										<p className='text-sm text-green-800'>{localSuccess}</p>
									</div>
								)}

								<button
									type='submit'
									className='mt-2 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60'
									style={{
										backgroundColor: theme.submitButtonColor,
										color: theme.submitButtonTextColor,
										filter: hoveredButton === 'forgot-password' ? 'brightness(90%)' : 'none',
									}}
									onMouseEnter={() => setHoveredButton('forgot-password')}
									onMouseLeave={() => setHoveredButton(null)}
									disabled={isSendingReset}
								>
									{isSendingReset ? (
										<>
											<FontAwesomeIcon icon={faSpinner} spin />
											Wird gesendet
										</>
									) : (
										'Passwort zurücksetzen'
									)}
								</button>
							</div>
						</form>
					)}
				</div>
			)}
		</div>
	)
}

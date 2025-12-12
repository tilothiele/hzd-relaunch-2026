'use client'

import { useCallback, useEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faRightFromBracket, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { Menu, MenuItem, IconButton, Box, Tabs, Tab } from '@mui/material'
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
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
	const [isRegistering, setIsRegistering] = useState(false)
	const [isSendingReset, setIsSendingReset] = useState(false)

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
			setEmail('')
			setUsername('')
			setConfirmPassword('')
			setActiveTab('login')
		}
	}, [isAuthenticated])

	useEffect(() => {
		setLocalError(error ?? null)
	}, [error])

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

	const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: TabValue) => {
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

	const handleRegisterSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setLocalError(null)
		setLocalSuccess(null)

		if (password !== confirmPassword) {
			setLocalError('Die Passwörter stimmen nicht überein.')
			return
		}

		if (password.length < 6) {
			setLocalError('Das Passwort muss mindestens 6 Zeichen lang sein.')
			return
		}

		setIsRegistering(true)

		try {
			const result = await fetchGraphQL<{ register: { jwt: string; user: AuthUser } }>(
				REGISTER_USER,
				{
					variables: {
						input: {
							username,
							email,
							password,
						},
					},
				},
			)

			if (result.register?.jwt) {
				// Automatisch einloggen nach erfolgreicher Registrierung
				await onLogin({ identifier: email || username, password })
				setLocalSuccess('Registrierung erfolgreich! Sie sind jetzt angemeldet.')
			}
		} catch (submissionError) {
			if (submissionError instanceof Error && submissionError.message) {
				setLocalError(submissionError.message)
			} else {
				setLocalError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.')
			}
		} finally {
			setIsRegistering(false)
			setPassword('')
			setConfirmPassword('')
		}
	}, [username, email, password, confirmPassword, onLogin])

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

	const open = Boolean(anchorEl)
	const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const clearCloseTimeout = useCallback(() => {
		if (closeTimeoutRef.current) {
			clearTimeout(closeTimeoutRef.current)
			closeTimeoutRef.current = null
		}
	}, [])

	const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLElement>) => {
		clearCloseTimeout()
		setAnchorEl(event.currentTarget)
	}, [clearCloseTimeout])

	const handleMouseLeave = useCallback(() => {
		// Verzögerung, damit der Benutzer zum Menü navigieren kann
		clearCloseTimeout()
		closeTimeoutRef.current = setTimeout(() => {
			setAnchorEl(null)
			closeTimeoutRef.current = null
		}, 300)
	}, [clearCloseTimeout])

	const handleMenuMouseEnter = useCallback(() => {
		clearCloseTimeout()
	}, [clearCloseTimeout])

	const handleMenuMouseLeave = useCallback(() => {
		clearCloseTimeout()
		setAnchorEl(null)
	}, [clearCloseTimeout])

	const handleLogoutClick = useCallback(() => {
		setAnchorEl(null)
		handleLogout()
	}, [handleLogout])

	if (isAuthenticated) {

		return (
			<Box>
				<Box
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						cursor: 'pointer',
						padding: '4px 8px',
						borderRadius: 1,
						transition: 'background-color 0.2s',
						'&:hover': {
							backgroundColor: 'rgba(255, 255, 255, 0.1)',
						},
					}}
					aria-label='Benutzermenü'
					aria-controls={open ? 'user-menu' : undefined}
					aria-haspopup='true'
					aria-expanded={open ? 'true' : undefined}
				>
					<FontAwesomeIcon
						icon={faUser}
						style={{ color: '#22c55e', fontSize: '2rem' }}
					/>
					<span style={{ fontSize: '1.4rem', color: theme.headerFooterTextColor }}>{userLabel}</span>
				</Box>
				<Menu
					id='user-menu'
					anchorEl={anchorEl}
					open={open}
					onClose={handleMenuMouseLeave}
					onMouseEnter={handleMenuMouseEnter}
					onMouseLeave={handleMenuMouseLeave}
					MenuListProps={{
						onMouseEnter: handleMenuMouseEnter,
						onMouseLeave: handleMenuMouseLeave,
					}}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'right',
					}}
					transformOrigin={{
						vertical: 'top',
						horizontal: 'right',
					}}
					sx={{
						'& .MuiPaper-root': {
							backgroundColor: '#ffffff',
							color: theme.textColor,
							mt: 1,
							minWidth: 180,
							borderRadius: 2,
							border: '1px solid rgba(0, 0, 0, 0.08)',
							boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
						},
					}}
				>
					<MenuItem
						component={Link}
						href='/mein-hzd'
						onClick={() => setAnchorEl(null)}
						sx={{
							color: theme.textColor,
							'&:hover': {
								backgroundColor: 'rgba(252, 211, 77, 0.1)',
								color: '#FCD34D',
							},
						}}
					>
						Mein HZD
					</MenuItem>
					<MenuItem
						onClick={handleLogoutClick}
						sx={{
							color: theme.textColor,
							'&:hover': {
								backgroundColor: 'rgba(252, 211, 77, 0.1)',
								color: '#FCD34D',
							},
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: '0.875rem' }} />
							Logout
						</Box>
					</MenuItem>
				</Menu>
			</Box>
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
				<div
					className='absolute right-0 z-50 mt-3 w-96 rounded-lg text-gray-900 shadow-xl border border-gray-200'
					style={{
						backgroundColor: '#ffffff',
					}}
				>
					<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
						<Tabs
							value={activeTab}
							onChange={handleTabChange}
							aria-label='Login-Register-Tabs'
							sx={{
								'& .MuiTab-root': {
									textTransform: 'none',
									fontSize: '0.875rem',
									minHeight: '48px',
								},
							}}
						>
							<Tab label='Anmeldung' value='login' />
							<Tab label='Registrieren' value='register' />
							<Tab label='Passwort vergessen' value='forgot-password' />
						</Tabs>
					</Box>

					{activeTab === 'login' && (
						<form
							id='login-form'
							onSubmit={handleLoginSubmit}
							style={{ padding: '1.5rem' }}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
								<label className='block text-sm font-medium text-gray-700'>
									<span className='block' style={{ marginBottom: '0.5rem' }}>
										E-Mail oder Benutzername
									</span>
									<input
										type='text'
										name='identifier'
										value={identifier}
										onChange={(event: ChangeEvent<HTMLInputElement>) => setIdentifier(event.target.value)}
										className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										style={{ backgroundColor: '#e5e7eb' }}
										autoComplete='username'
										required
									/>
								</label>
								<label className='block text-sm font-medium text-gray-700'>
									<span className='block' style={{ marginBottom: '0.5rem' }}>
										Passwort
									</span>
									<input
										type='password'
										name='password'
										value={password}
										onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
										className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										style={{ backgroundColor: '#e5e7eb' }}
										autoComplete='current-password'
										required
									/>
								</label>
								{localError ? (
									<div className='rounded-md bg-red-50 p-3'>
										<p className='text-sm text-red-800'>{localError}</p>
									</div>
								) : null}
								{localSuccess ? (
									<div className='rounded-md bg-green-50 p-3'>
										<p className='text-sm text-green-800'>{localSuccess}</p>
									</div>
								) : null}
								<button
									type='submit'
									className='flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-yellow-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-yellow-400 disabled:hover:shadow-none'
									style={{
										backgroundColor: '#facc15',
										color: '#111827',
										marginTop: '0.5rem',
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
							</div>
						</form>
					)}

					{activeTab === 'register' && (
						<form
							id='register-form'
							onSubmit={handleRegisterSubmit}
							style={{ padding: '1.5rem' }}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
								<label className='block text-sm font-medium text-gray-700'>
									<span className='block' style={{ marginBottom: '0.5rem' }}>
										Benutzername
									</span>
									<input
										type='text'
										name='username'
										value={username}
										onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)}
										className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										style={{ backgroundColor: '#e5e7eb' }}
										autoComplete='username'
										required
									/>
								</label>
								<label className='block text-sm font-medium text-gray-700'>
									<span className='block' style={{ marginBottom: '0.5rem' }}>
										E-Mail
									</span>
									<input
										type='email'
										name='email'
										value={email}
										onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
										className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										style={{ backgroundColor: '#e5e7eb' }}
										autoComplete='email'
										required
									/>
								</label>
								<label className='block text-sm font-medium text-gray-700'>
									<span className='block' style={{ marginBottom: '0.5rem' }}>
										Passwort
									</span>
									<input
										type='password'
										name='password'
										value={password}
										onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
										className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										style={{ backgroundColor: '#e5e7eb' }}
										autoComplete='new-password'
										required
									/>
								</label>
								<label className='block text-sm font-medium text-gray-700'>
									<span className='block' style={{ marginBottom: '0.5rem' }}>
										Passwort bestätigen
									</span>
									<input
										type='password'
										name='confirmPassword'
										value={confirmPassword}
										onChange={(event: ChangeEvent<HTMLInputElement>) => setConfirmPassword(event.target.value)}
										className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										style={{ backgroundColor: '#e5e7eb' }}
										autoComplete='new-password'
										required
									/>
								</label>
								{localError ? (
									<div className='rounded-md bg-red-50 p-3'>
										<p className='text-sm text-red-800'>{localError}</p>
									</div>
								) : null}
								{localSuccess ? (
									<div className='rounded-md bg-green-50 p-3'>
										<p className='text-sm text-green-800'>{localSuccess}</p>
									</div>
								) : null}
								<button
									type='submit'
									className='flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-yellow-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-yellow-400 disabled:hover:shadow-none'
									style={{
										backgroundColor: '#facc15',
										color: '#111827',
										marginTop: '0.5rem',
									}}
									disabled={isRegistering}
								>
									{isRegistering ? (
										<>
											<FontAwesomeIcon icon={faSpinner} spin />
											Registrierung läuft
										</>
									) : (
										'Registrieren'
									)}
								</button>
							</div>
						</form>
					)}

					{activeTab === 'forgot-password' && (
						<form
							id='forgot-password-form'
							onSubmit={handleForgotPasswordSubmit}
							style={{ padding: '1.5rem' }}
						>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
								<p className='text-sm text-gray-600 mb-2'>
									Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
								</p>
								<label className='block text-sm font-medium text-gray-700'>
									<span className='block' style={{ marginBottom: '0.5rem' }}>
										E-Mail
									</span>
									<input
										type='email'
										name='email'
										value={email}
										onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
										className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
										style={{ backgroundColor: '#e5e7eb' }}
										autoComplete='email'
										required
									/>
								</label>
								{localError ? (
									<div className='rounded-md bg-red-50 p-3'>
										<p className='text-sm text-red-800'>{localError}</p>
									</div>
								) : null}
								{localSuccess ? (
									<div className='rounded-md bg-green-50 p-3'>
										<p className='text-sm text-green-800'>{localSuccess}</p>
									</div>
								) : null}
								<button
									type='submit'
									className='flex w-full items-center justify-center gap-2 rounded-md bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-yellow-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-yellow-400 disabled:hover:shadow-none'
									style={{
										backgroundColor: '#facc15',
										color: '#111827',
										marginTop: '0.5rem',
									}}
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
			) : null}
		</div>
	)
}


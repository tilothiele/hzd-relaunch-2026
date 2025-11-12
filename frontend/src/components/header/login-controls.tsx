'use client'

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faRightFromBracket, faSpinner } from '@fortawesome/free-solid-svg-icons'
import type { AuthUser } from '@/types'
import type { ThemeDefinition } from '@/themes'

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
					<FontAwesomeIcon
						icon={faUser}
						className='text-green-500'
					/>
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
					className='absolute right-0 z-50 mt-3 w-96 rounded-lg p-6 text-gray-900 shadow-xl border border-gray-200'
					style={{
						backgroundColor: '#ffffff',
					}}
				>
					<h3
						className='text-lg font-semibold text-gray-900 my-4'
						style={{ marginTop: '1rem', marginLeft: '1.5rem', marginRight: '1.5rem' }}
					>
						Anmeldung
					</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem'}}>
						<label className='block text-sm font-medium text-gray-700'>
							<span
								className='block'
								style={{ margin: '0.5rem' }}
							>
								E-Mail oder Benutzername
							</span>
							<input
								type='text'
								name='identifier'
								value={identifier}
								onChange={(event: ChangeEvent<HTMLInputElement>) => setIdentifier(event.target.value)}
								className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
								style={{
									backgroundColor: '#e5e7eb',
								}}
								autoComplete='username'
								required
							/>
						</label>
						<label className='block text-sm font-medium text-gray-700'>
							<span
								className='block'
								style={{ marginBottom: '0.5rem' }}
							>
								Passwort
							</span>
							<input
								type='password'
								name='password'
								value={password}
								onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
								className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
								style={{
									backgroundColor: '#e5e7eb',
								}}
								autoComplete='current-password'
								required
							/>
						</label>
						{localError ? (
							<div className='rounded-md bg-red-50 p-3'>
								<p className='text-sm text-red-800'>
									{localError}
								</p>
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
			) : null}
		</div>
	)
}


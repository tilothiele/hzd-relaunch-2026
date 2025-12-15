'use client'

import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

interface ResetPasswordFormProps {
	code?: string
	strapiBaseUrl?: string | null
}

interface ResetPasswordInput {
	code: string
	password: string
	passwordConfirmation: string
}

interface ResetPasswordResponse {
	jwt: string
	user: {
		id: number
		username: string
		email: string
	}
}

export function ResetPasswordForm({ code, strapiBaseUrl }: ResetPasswordFormProps) {
	const router = useRouter()
	const [password, setPassword] = useState('')
	const [passwordConfirmation, setPasswordConfirmation] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isSuccess, setIsSuccess] = useState(false)

	const handleSubmit = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault()
			setError(null)

			if (!code) {
				setError('Reset-Code fehlt. Bitte verwenden Sie den Link aus der E-Mail.')
				return
			}

			if (!password || password.length < 6) {
				setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
				return
			}

			if (password !== passwordConfirmation) {
				setError('Die Passwörter stimmen nicht überein.')
				return
			}

			setIsSubmitting(true)

			try {
				const input: ResetPasswordInput = {
					code,
					password,
					passwordConfirmation,
				}

				const response = await fetch('/api/auth/reset-password', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(input),
				})

				if (!response.ok) {
					const errorPayload = await response.json().catch(() => null)
					const message =
						errorPayload?.error?.message ??
						'Passwort konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut.'
					throw new Error(message)
				}

				const data = (await response.json()) as ResetPasswordResponse

				if (data?.jwt) {
					setIsSuccess(true)
					// Nach erfolgreichem Reset zum Login weiterleiten
					setTimeout(() => {
						router.push('/')
					}, 2000)
				} else {
					setError('Passwort konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut.')
				}
			} catch (err) {
				console.error('Reset Password Error:', err)
				const errorMessage =
					err instanceof Error
						? err.message
						: 'Passwort konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut.'
				setError(errorMessage)
			} finally {
				setIsSubmitting(false)
			}
		},
		[code, password, passwordConfirmation, router]
	)

	if (!code) {
		return (
			<div className='rounded-md bg-red-50 p-4'>
				<p className='text-sm text-red-800'>
					Reset-Code fehlt. Bitte verwenden Sie den Link aus der E-Mail, um Ihr Passwort zurückzusetzen.
				</p>
			</div>
		)
	}

	if (isSuccess) {
		return (
			<div className='rounded-md bg-green-50 p-4'>
				<p className='text-sm text-green-800'>
					Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden gleich weitergeleitet...
				</p>
			</div>
		)
	}

	return (
		<div className='rounded-lg border border-gray-200 bg-white shadow-sm' style={{ padding: '2rem' }}>
			<h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
				Passwort ändern
			</h1>
			<p className='mb-6 text-sm text-gray-600'>
				Bitte geben Sie Ihr neues Passwort ein. Es muss mindestens 6 Zeichen lang sein.
			</p>
			<form onSubmit={handleSubmit} className='flex flex-col gap-4'>
				<label className='block text-sm font-medium text-gray-700'>
					<span className='block' style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
						Neues Passwort <span className='text-red-500'>*</span>
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
						minLength={6}
					/>
				</label>
				<label className='block text-sm font-medium text-gray-700'>
					<span className='block' style={{ marginBottom: '0.5rem' }}>
						Passwort bestätigen <span className='text-red-500'>*</span>
					</span>
					<input
						type='password'
						name='passwordConfirmation'
						value={passwordConfirmation}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							setPasswordConfirmation(event.target.value)
						}
						className='w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1'
						style={{ backgroundColor: '#e5e7eb' }}
						autoComplete='new-password'
						required
						minLength={6}
					/>
				</label>
				{error ? (
					<div className='rounded-md bg-red-50 p-3'>
						<p className='text-sm text-red-800'>{error}</p>
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
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<FontAwesomeIcon icon={faSpinner} spin />
							Wird geändert...
						</>
					) : (
						'Passwort ändern'
					)}
				</button>
			</form>
		</div>
	)
}


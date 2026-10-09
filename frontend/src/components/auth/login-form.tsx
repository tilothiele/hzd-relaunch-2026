'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	TextField,
	Typography,
} from '@mui/material'
import { AltchaField } from '@/components/altcha/altcha-field'
import { AuthFormCard } from '@/components/auth/auth-form-card'
import { useAuth } from '@/hooks/use-auth'
import { sanitizeCallbackUrl } from '@/lib/auth-login'

interface LoginFormProps {
	callbackUrl?: string
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
	const router = useRouter()
	const { login, isAuthenticated, isInitialized } = useAuth()
	const [identifier, setIdentifier] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [altchaVerified, setAltchaVerified] = useState(false)
	const [altchaReset, setAltchaReset] = useState(0)
	const redirectTo = sanitizeCallbackUrl(callbackUrl)

	useEffect(() => {
		if (isInitialized && isAuthenticated) {
			router.replace(redirectTo)
		}
	}, [isAuthenticated, isInitialized, redirectTo, router])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)
		if (!altchaVerified) {
			setError('Bitte bestätigen Sie, dass Sie kein automatisiertes Programm sind.')
			return
		}
		setIsSubmitting(true)

		try {
			await login(identifier, password)
			router.replace(redirectTo)
			router.refresh()
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: 'Anmeldung fehlgeschlagen.',
			)
		} finally {
			setIsSubmitting(false)
			setAltchaReset((current) => current + 1)
		}
	}

	return (
		<AuthFormCard title='Anmelden'>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
				Melden Sie sich mit Ihrer E-Mail-Adresse oder Ihrem Benutzernamen
				und dem Passwort an.
			</Typography>

			{error && (
				<Alert severity='error' sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Box
				component='form'
				onSubmit={handleSubmit}
				sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
			>
				<TextField
					fullWidth
					required
					autoComplete='username'
					label='E-Mail oder Benutzername'
					name='identifier'
					value={identifier}
					onChange={(event) => setIdentifier(event.target.value)}
				/>
				<TextField
					fullWidth
					required
					autoComplete='current-password'
					type='password'
					label='Passwort'
					name='password'
					value={password}
					onChange={(event) => setPassword(event.target.value)}
				/>
				<AltchaField
					onVerifiedChange={setAltchaVerified}
					resetSignal={altchaReset}
				/>
				<Button
					type='submit'
					variant='contained'
					disabled={isSubmitting || !altchaVerified}
					sx={{ mt: 1 }}
				>
					{isSubmitting ? <CircularProgress size={24} /> : 'Anmelden'}
				</Button>
			</Box>

			<Typography variant='body2' sx={{ mt: 3 }}>
				<Link href='/forgot-password' className='underline'>
					Passwort vergessen?
				</Link>
			</Typography>
		</AuthFormCard>
	)
}

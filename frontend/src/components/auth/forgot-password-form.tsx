'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
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
import { requestPasswordReset } from '@/lib/auth-api'

export function ForgotPasswordForm() {
	const [email, setEmail] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitted, setIsSubmitted] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [altchaVerified, setAltchaVerified] = useState(false)
	const [altchaReset, setAltchaReset] = useState(0)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)
		if (!altchaVerified) {
			setError('Bitte bestätigen Sie, dass Sie kein automatisiertes Programm sind.')
			return
		}
		setIsSubmitting(true)

		try {
			await requestPasswordReset(email)
			setIsSubmitted(true)
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: 'Die Anfrage ist fehlgeschlagen.',
			)
		} finally {
			setIsSubmitting(false)
			setAltchaReset((current) => current + 1)
		}
	}

	return (
		<AuthFormCard title='Passwort vergessen'>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
				Geben Sie die E-Mail-Adresse Ihres Mitgliederkontos ein. Wenn ein
				Konto existiert, senden wir Ihnen einen Link zum Zurücksetzen des
				Passworts.
			</Typography>

			{error && (
				<Alert severity='error' sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{isSubmitted ? (
				<Alert severity='success'>
					Falls ein Konto mit dieser E-Mail-Adresse existiert, erhalten
					Sie in Kürze eine Nachricht mit einem Link zum Zurücksetzen.
				</Alert>
			) : (
				<Box
					component='form'
					onSubmit={handleSubmit}
					sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
				>
					<TextField
						fullWidth
						required
						type='email'
						autoComplete='email'
						label='E-Mail-Adresse'
						name='email'
						value={email}
						onChange={(event) => setEmail(event.target.value)}
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
						{isSubmitting
							? <CircularProgress size={24} />
							: 'Link zum Zurücksetzen senden'}
					</Button>
				</Box>
			)}

			<Typography variant='body2' sx={{ mt: 3 }}>
				<Link href='/login' className='underline'>
					Zurück zur Anmeldung
				</Link>
			</Typography>
		</AuthFormCard>
	)
}

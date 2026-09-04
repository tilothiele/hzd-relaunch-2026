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
import { AuthFormCard } from '@/components/auth/auth-form-card'
import { useAuth } from '@/hooks/use-auth'
import { resetPasswordWithCode } from '@/lib/auth-api'
import { fetchMe } from '@/lib/strapi/api'

interface ResetPasswordFormProps {
	code?: string
}

export function ResetPasswordForm({ code }: ResetPasswordFormProps) {
	const router = useRouter()
	const { applyAuthSession } = useAuth()
	const [password, setPassword] = useState('')
	const [passwordConfirmation, setPasswordConfirmation] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEffect(() => {
		if (!code) {
			setError('Der Link ist ungültig oder unvollständig. Bitte fordern Sie einen neuen an.')
		}
	}, [code])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)

		if (!code) {
			setError('Der Link ist ungültig oder unvollständig.')
			return
		}

		if (password !== passwordConfirmation) {
			setError('Die Passwörter stimmen nicht überein.')
			return
		}

		setIsSubmitting(true)

		try {
			const result = await resetPasswordWithCode({
				code,
				password,
				passwordConfirmation,
			})
			let user = result.user ?? null

			try {
				const meData = await fetchMe(result.jwt)
				user = meData.me ?? user
			} catch (profileError) {
				console.error('[Auth] Profil nach Passwort-Reset nicht geladen:', profileError)
			}

			applyAuthSession(result.jwt, user)
			router.replace('/')
			router.refresh()
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: 'Passwort konnte nicht gesetzt werden.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<AuthFormCard title='Neues Passwort setzen'>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
				Bitte vergeben Sie ein neues Passwort für Ihr Mitgliederkonto.
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
					type='password'
					autoComplete='new-password'
					label='Neues Passwort'
					name='password'
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					disabled={!code}
				/>
				<TextField
					fullWidth
					required
					type='password'
					autoComplete='new-password'
					label='Neues Passwort bestätigen'
					name='passwordConfirmation'
					value={passwordConfirmation}
					onChange={(event) => setPasswordConfirmation(event.target.value)}
					disabled={!code}
				/>
				<Button
					type='submit'
					variant='contained'
					disabled={isSubmitting || !code}
					sx={{ mt: 1 }}
				>
					{isSubmitting
						? <CircularProgress size={24} />
						: 'Passwort speichern'}
				</Button>
			</Box>

			<Typography variant='body2' sx={{ mt: 3 }}>
				<Link href='/forgot-password' className='underline'>
					Neuen Link anfordern
				</Link>
			</Typography>
		</AuthFormCard>
	)
}

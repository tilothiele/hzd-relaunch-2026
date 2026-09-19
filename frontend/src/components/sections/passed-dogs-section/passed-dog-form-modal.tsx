'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	IconButton,
	TextField,
	Typography,
	useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import type { ThemeDefinition } from '@/themes'
import { passedDogDateBounds } from '@/lib/passed-dogs-limits'
import type { PassedDogCardData } from '@/lib/server/passed-dog-utils'
import {
	submitPassedDog,
	submitPassedDogUpdate,
} from '@/lib/server/passed-dog-actions'
import { useAuth } from '@/hooks/use-auth'

function sessionUserName(user: {
	firstName?: string | null
	lastName?: string | null
	DisplayName?: string | null
	username?: string | null
} | null): string {
	if (!user) {
		return ''
	}
	const fromParts = [user.firstName, user.lastName]
		.filter(Boolean)
		.join(' ')
		.trim()
	return user.DisplayName?.trim() || fromParts || user.username?.trim() || ''
}

function sessionEmail(user: {
	cEmail?: string | null
	email?: string | null
} | null): string {
	return user?.cEmail?.trim() || user?.email?.trim() || ''
}

interface PassedDogFormModalProps {
	open: boolean
	onClose: () => void
	mode: 'create' | 'edit'
	initial: PassedDogCardData | null
	theme: ThemeDefinition
	onSuccess: () => void
}

export function PassedDogFormModal({
	open,
	onClose,
	mode,
	initial,
	theme,
	onSuccess,
}: PassedDogFormModalProps) {
	const muiTheme = useTheme()
	const { user, isAuthenticated } = useAuth()
	const fullScreen = useMediaQuery(muiTheme.breakpoints.down('sm'))
	const lockedEmail = isAuthenticated ? sessionEmail(user) : ''
	const { min: minDate, max: maxDate } = useMemo(
		() => passedDogDateBounds(),
		[],
	)

	const [dogName, setDogName] = useState('')
	const [userName, setUserName] = useState('')
	const [email, setEmail] = useState('')
	const [datePassed, setDatePassed] = useState(maxDate)
	const [message, setMessage] = useState('')
	const [healthInfo, setHealthInfo] = useState('')
	const [consentPublish, setConsentPublish] = useState(true)
	const [file, setFile] = useState<File | null>(null)
	const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
	const [submitting, setSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)

	useEffect(() => {
		if (!file) {
			setFilePreviewUrl(null)
			return
		}
		const url = URL.createObjectURL(file)
		setFilePreviewUrl(url)
		return () => {
			URL.revokeObjectURL(url)
		}
	}, [file])

	const resetFromInitial = useCallback(() => {
		setFormError(null)
		setFile(null)
		if (mode === 'edit' && initial) {
			setDogName(initial.DogName ?? '')
			setUserName(initial.UserName ?? sessionUserName(user))
			setEmail(initial.EMail ?? sessionEmail(user))
			setDatePassed(
				initial.DatePassed
					? String(initial.DatePassed).slice(0, 10)
					: maxDate,
			)
			setMessage(initial.Message ?? '')
			setHealthInfo(initial.HealthInfo ?? '')
			setConsentPublish(initial.Consent === true)
			return
		}
		setDogName('')
		setUserName(sessionUserName(user))
		setEmail(sessionEmail(user))
		setDatePassed(maxDate)
		setMessage('')
		setHealthInfo('')
		setConsentPublish(true)
	}, [mode, initial, user, maxDate])

	useEffect(() => {
		if (!open) {
			return
		}
		resetFromInitial()
	}, [open, resetFromInitial])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setFormError(null)

		if (!dogName.trim()) {
			setFormError('Bitte geben Sie den Namen des Hundes an.')
			return
		}
		if (!userName.trim()) {
			setFormError('Bitte geben Sie Ihren Namen an.')
			return
		}
		const contactEmail = (lockedEmail || email).trim()
		if (!contactEmail) {
			setFormError('Bitte geben Sie Ihre E-Mail-Adresse an.')
			return
		}
		if (!datePassed) {
			setFormError('Bitte wählen Sie das Sterbedatum.')
			return
		}

		setSubmitting(true)
		try {
			const fd = new FormData()
			fd.set('dogName', dogName.trim())
			fd.set('userName', userName.trim())
			fd.set('email', contactEmail)
			fd.set('datePassed', datePassed)
			fd.set('message', message.trim())
			fd.set('healthInfo', healthInfo.trim())
			fd.set('consent', consentPublish ? 'true' : 'false')
			if (file) {
				fd.set('avatar', file, file.name)
			}

			const result = mode === 'edit' && initial
				? await submitPassedDogUpdate(initial.documentId, fd)
				: await submitPassedDog(fd)

			if (!result.ok) {
				setFormError(result.error)
				return
			}

			onSuccess()
			onClose()
		} catch (err) {
			setFormError(
				err instanceof Error ? err.message : 'Speichern fehlgeschlagen.',
			)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Dialog
			open={open}
			onClose={submitting ? undefined : onClose}
			fullScreen={fullScreen}
			fullWidth
			maxWidth="sm"
			scroll="paper"
		>
			<DialogTitle
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					pr: 1,
					color: theme.headlineColor,
				}}
			>
				{mode === 'create'
					? 'Mitteilung: Hund verstorben'
					: 'Eintrag bearbeiten'}
				<IconButton
					aria-label="Schließen"
					onClick={onClose}
					disabled={submitting}
					size="small"
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<form onSubmit={handleSubmit}>
				<DialogContent
					dividers
					sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
				>
					{formError ? (
						<Typography color="error" variant="body2">
							{formError}
						</Typography>
					) : null}

					<TextField
						label="Name + Zwingername"
						value={dogName}
						onChange={(e) => setDogName(e.target.value)}
						required
						fullWidth
						disabled={submitting}
					/>

					<TextField
						label="Ihr Name"
						value={userName}
						onChange={(e) => setUserName(e.target.value)}
						required
						fullWidth
						disabled={submitting}
					/>

					<TextField
						label="Ihre E-Mail-Adresse"
						type="email"
						value={lockedEmail || email}
						onChange={(e) => setEmail(e.target.value)}
						required
						fullWidth
						disabled={submitting || Boolean(lockedEmail)}
						helperText={
							lockedEmail
								? 'Wir verwenden die E-Mail-Adresse Ihres Kontos.'
								: undefined
						}
					/>

					<TextField
						label="Sterbedatum"
						type="date"
						value={datePassed}
						onChange={(e) => setDatePassed(e.target.value)}
						required
						fullWidth
						disabled={submitting}
						inputProps={{ min: minDate, max: maxDate }}
						InputLabelProps={{ shrink: true }}
					/>

					<TextField
						label="Mitteilung"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						fullWidth
						multiline
						minRows={3}
						disabled={submitting}
					/>

					<FormControlLabel
						control={
							<Checkbox
								checked={consentPublish}
								onChange={(e) => setConsentPublish(e.target.checked)}
								disabled={submitting}
							/>
						}
						label="Meine Mitteilung gerne hier veröffentlichen"
					/>

					<TextField
						label="Gesundheitsinformationen (optional/vertraulich)"
						value={healthInfo}
						onChange={(e) => setHealthInfo(e.target.value)}
						fullWidth
						multiline
						minRows={2}
						disabled={submitting}
						helperText="Wichtiger Hinweis: nur interne Information - wird nicht veröffentlicht"
					/>

					<div>
						<label
							htmlFor="passed-dog-avatar"
							className="mb-1 block text-sm font-medium text-neutral-700"
						>
							Bild (optional)
						</label>
						<input
							id="passed-dog-avatar"
							type="file"
							accept="image/*"
							disabled={submitting}
							onChange={(e) => {
								setFile(e.target.files?.[0] ?? null)
							}}
							className="w-full text-sm"
						/>
						{filePreviewUrl ? (
							<div className="mt-3 flex justify-start">
								<img
									src={filePreviewUrl}
									alt="Vorschau gewähltes Bild"
									className="max-h-48 max-w-full rounded-lg border border-neutral-200 object-contain shadow-sm"
								/>
							</div>
						) : null}
					</div>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2 }}>
					<Button onClick={onClose} disabled={submitting} color="inherit">
						Abbrechen
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={submitting}
						sx={{
							bgcolor: theme.buttonColor,
							'&:hover': { bgcolor: theme.buttonColor },
						}}
					>
						{submitting ? '…' : 'Abschicken'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	)
}

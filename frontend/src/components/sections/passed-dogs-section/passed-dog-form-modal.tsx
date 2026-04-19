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
import { fetchGraphQL } from '@/lib/graphql-client'
import {
	GET_MY_ALIVE_DOGS,
	GET_MY_PENDING_PASSED_DOGS,
} from '@/lib/graphql/passed-dogs-queries'
import { MAX_PENDING_PASSED_DOGS } from '@/lib/passed-dogs-limits'
import { CREATE_PASSED_DOG, UPDATE_PASSED_DOG } from '@/lib/graphql/mutations'
import type { PassedDogCardData } from '@/lib/server/passed-dog-utils'

interface AliveDog {
	documentId: string
	fullKennelName?: string | null
}

function readAuthToken(): string | null {
	if (typeof window === 'undefined') {
		return null
	}
	try {
		const raw = localStorage.getItem('hzd_auth_state')
		if (!raw) {
			return null
		}
		const p = JSON.parse(raw) as { token?: string | null }
		return typeof p.token === 'string' ? p.token : null
	} catch {
		return null
	}
}

function ymd(d: Date): string {
	return d.toISOString().slice(0, 10)
}

function dateBounds(): { min: string; max: string } {
	const today = new Date()
	const max = ymd(today)
	const minD = new Date(today)
	minD.setFullYear(minD.getFullYear() - 1)
	return { min: ymd(minD), max }
}

async function uploadAvatar(
	file: File,
	token: string,
): Promise<string | number> {
	const fd = new FormData()
	fd.append('files', file, file.name)
	const res = await fetch('/api/strapi/upload', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: fd,
	})
	if (!res.ok) {
		const t = await res.text()
		throw new Error(t || 'Bild-Upload fehlgeschlagen.')
	}
	const data = (await res.json()) as Array<{ id?: number; documentId?: string }>
	const first = Array.isArray(data) ? data[0] : null
	const id = first?.id ?? first?.documentId
	if (id === undefined || id === null) {
		throw new Error('Ungültige Upload-Antwort.')
	}
	return id
}

interface PassedDogFormModalProps {
	open: boolean
	onClose: () => void
	mode: 'create' | 'edit'
	initial: PassedDogCardData | null
	theme: ThemeDefinition
	userDocumentId: string
	onSuccess: () => void
}

export function PassedDogFormModal({
	open,
	onClose,
	mode,
	initial,
	theme,
	userDocumentId,
	onSuccess,
}: PassedDogFormModalProps) {
	const muiTheme = useTheme()
	const fullScreen = useMediaQuery(muiTheme.breakpoints.down('sm'))
	const { min: minDate, max: maxDate } = useMemo(() => dateBounds(), [])

	const [aliveDogs, setAliveDogs] = useState<AliveDog[]>([])
	const [dogId, setDogId] = useState('')
	const [dogName, setDogName] = useState('')
	const [datePassed, setDatePassed] = useState(maxDate)
	const [message, setMessage] = useState('')
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

	const loadAliveDogs = useCallback(async () => {
		try {
			const res = await fetchGraphQL<{ hzdPluginDogs: AliveDog[] }>(
				GET_MY_ALIVE_DOGS,
				{ variables: { ownerId: userDocumentId } },
			)
			setAliveDogs(res.hzdPluginDogs ?? [])
		} catch (e) {
			console.error(e)
			setAliveDogs([])
		}
	}, [userDocumentId])

	useEffect(() => {
		if (!open) {
			return
		}
		setFormError(null)
		loadAliveDogs()
		if (mode === 'edit' && initial) {
			setDogId(initial.hzd_plugin_dog?.documentId ?? '')
			setDogName(initial.DogName ?? '')
			setDatePassed(
				initial.DatePassed
					? String(initial.DatePassed).slice(0, 10)
					: maxDate,
			)
			setMessage(initial.Message ?? '')
			setConsentPublish(initial.Consent === true)
			setFile(null)
		} else {
			setDogId('')
			setDogName('')
			setDatePassed(maxDate)
			setMessage('')
			setConsentPublish(true)
			setFile(null)
		}
	}, [open, mode, initial, loadAliveDogs, maxDate])

	const selectedDog = aliveDogs.find((d) => d.documentId === dogId)
	const nameRequired = !dogId

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setFormError(null)

		if (nameRequired && !dogName.trim()) {
			setFormError('Bitte geben Sie den Namen des Hundes an.')
			return
		}

		if (!datePassed) {
			setFormError('Bitte wählen Sie das Sterbedatum.')
			return
		}

		setSubmitting(true)
		try {
			if (mode === 'create') {
				const pendingCheck = await fetchGraphQL<{
					passedDogs: { documentId: string }[]
				}>(GET_MY_PENDING_PASSED_DOGS, {
					variables: { userId: userDocumentId },
				})
				const pendingCount = pendingCheck.passedDogs?.length ?? 0
				if (pendingCount >= MAX_PENDING_PASSED_DOGS) {
					setFormError(
						`Sie dürfen höchstens ${MAX_PENDING_PASSED_DOGS} Einträge gleichzeitig in Prüfung haben.`,
					)
					return
				}
			}

			let avatarId: string | number | undefined
			if (file) {
				const token = readAuthToken()
				if (!token) {
					throw new Error('Nicht angemeldet.')
				}
				avatarId = await uploadAvatar(file, token)
			}

			const label = selectedDog?.fullKennelName?.trim() ?? ''

			if (mode === 'create') {
				const data: Record<string, unknown> = {
					users_permissions_user: userDocumentId,
					DatePassed: datePassed,
					Message: message.trim() || null,
					Approved: false,
					Consent: consentPublish,
					publishedAt: new Date().toISOString(),
				}
				if (dogId) {
					data.hzd_plugin_dog = dogId
					data.DogName = dogName.trim() || label || null
				} else {
					data.DogName = dogName.trim()
				}
				if (avatarId !== undefined) {
					data.Avatar = avatarId
				}
				await fetchGraphQL(CREATE_PASSED_DOG, {
					variables: { data },
				})
			} else if (initial) {
				const data: Record<string, unknown> = {
					DatePassed: datePassed,
					Message: message.trim() || null,
					Consent: consentPublish,
				}
				if (dogId) {
					data.hzd_plugin_dog = dogId
					data.DogName = dogName.trim() || label || null
				} else {
					data.DogName = dogName.trim()
				}
				if (avatarId !== undefined) {
					data.Avatar = avatarId
				}
				await fetchGraphQL(UPDATE_PASSED_DOG, {
					variables: { documentId: initial.documentId, data },
				})
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
				<DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					{formError ? (
						<Typography color="error" variant="body2">
							{formError}
						</Typography>
					) : null}

					<div>
						<label htmlFor="passed-dog-select" className="mb-1 block text-sm font-medium text-neutral-700">
							Hund auswählen (optional)
						</label>
						<select
							id="passed-dog-select"
							className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
							value={dogId}
							onChange={(e) => {
								setDogId(e.target.value)
								const next = aliveDogs.find(
									(d) => d.documentId === e.target.value,
								)
								if (next?.fullKennelName) {
									setDogName(next.fullKennelName)
								}
							}}
							disabled={submitting}
						>
							<option value="">— kein Eintrag aus der Datenbank —</option>
							{aliveDogs.map((d) => (
								<option key={d.documentId} value={d.documentId}>
									{d.fullKennelName || d.documentId}
								</option>
							))}
						</select>
					</div>

					<TextField
						label="Name des Hundes"
						value={dogName}
						onChange={(e) => setDogName(e.target.value)}
						required={nameRequired}
						fullWidth
						disabled={submitting}
						helperText={
							dogId
								? 'Optional, wenn ein Hund aus der Liste gewählt ist.'
								: 'Pflichtfeld, wenn kein Hund ausgewählt wurde.'
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

					<div>
						<label htmlFor="passed-dog-avatar" className="mb-1 block text-sm font-medium text-neutral-700">
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
						sx={{ bgcolor: theme.buttonColor, '&:hover': { bgcolor: theme.buttonColor } }}
					>
						{submitting ? '…' : 'Abschicken'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	)
}

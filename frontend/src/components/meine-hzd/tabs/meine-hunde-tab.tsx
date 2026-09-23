'use client'

import { useState, useEffect } from 'react'
import {
	Box,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	CircularProgress,
	Alert,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	FormControlLabel,
	Switch,
	Chip,
} from '@mui/material'
import { Edit as EditIcon } from '@mui/icons-material'
import { searchDogsGeneric, updateEntity } from '@/lib/strapi/api'
import type { AuthUser, Dog } from '@/types'
import { formatDate } from '@/lib/utils'
import { HtmlRichTextEditor } from '@/components/meine-hzd/html-rich-text-editor'

interface MeineHundeTabProps {
	user: AuthUser | null
	strapiBaseUrl?: string | null
}

interface DogEditFormData {
	MemosDraft: string
	DogOwnersMessage: string
	isDirty: boolean
}

export function MeineHundeTab({ user, strapiBaseUrl }: MeineHundeTabProps) {
	const [dogs, setDogs] = useState<Dog[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [editingDog, setEditingDog] = useState<Dog | null>(null)
	const [editFormData, setEditFormData] = useState<DogEditFormData | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

	useEffect(() => {
		async function loadDogs() {
			if (!user?.documentId) return

			setLoading(true)
			setError(null)
			try {
				const filters: Record<string, unknown> = {
					cFertile: { eq: true },
				}
				const hasValidDocumentId = typeof user.documentId === 'string'
					&& user.documentId.length > 0
					&& !user.documentId.includes('@')

				if (typeof user.cId === 'number') {
					filters.cOwnerId = { eq: user.cId }
				} else if (hasValidDocumentId) {
					filters.owner = { documentId: { eq: user.documentId } }
				} else {
					setError('Benutzer-cId fehlt — Hunde konnten nicht geladen werden.')
					setDogs([])
					return
				}

				const response = await searchDogsGeneric({
					filters,
					pagination: { pageSize: 100 },
					sort: ['dateOfBirth:desc'],
				}, {})

				if (response?.hzdPluginDogs_connection?.nodes) {
					setDogs(response.hzdPluginDogs_connection.nodes)
				} else {
					setDogs([])
				}
			} catch (err) {
				console.error('Failed to load dogs', err)
				setError('Fehler beim Laden der Hunde.')
			} finally {
				setLoading(false)
			}
		}

		loadDogs()
	}, [user, strapiBaseUrl])

	const handleEditClick = (dog: Dog) => {
		setEditingDog(dog)
		setEditFormData({
			MemosDraft: dog.MemosDraft || '',
			DogOwnersMessage: dog.DogOwnersMessage || '',
			isDirty: dog.isDirty === true,
		})
		setSaveMessage(null)
	}

	const handleCloseEdit = () => {
		if (isSaving) return
		setEditingDog(null)
		setEditFormData(null)
		setSaveMessage(null)
	}

	const handleSave = async () => {
		if (!editingDog || !editFormData) return

		setIsSaving(true)
		setSaveMessage(null)
		try {
			const result = await updateEntity<Dog>(
				'hzd-plugin/dogs',
				editingDog.documentId,
				{
					MemosDraft: editFormData.MemosDraft,
					DogOwnersMessage: editFormData.DogOwnersMessage,
					isDirty: editFormData.isDirty,
				},
				{},
			)

			setDogs((prev) => prev.map((dog) => (
				dog.documentId === editingDog.documentId
					? {
						...dog,
						...result,
						MemosDraft: editFormData.MemosDraft,
						DogOwnersMessage: editFormData.DogOwnersMessage,
						isDirty: editFormData.isDirty,
					}
					: dog
			)))
			setSaveMessage({ type: 'success', text: 'Änderungen erfolgreich gespeichert.' })
			setEditingDog(null)
			setEditFormData(null)
		} catch (err) {
			console.error('Failed to save dog:', err)
			setSaveMessage({ type: 'error', text: 'Fehler beim Speichern der Änderungen.' })
		} finally {
			setIsSaving(false)
		}
	}

	if (loading && dogs.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		)
	}

	if (error) {
		return (
			<Box sx={{ p: 2 }}>
				<Alert severity='error'>{error}</Alert>
			</Box>
		)
	}

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
				<Typography variant='h6'>
					Meine Zuchthunde
				</Typography>
			</Box>

			{!dogs.length ? (
				<Box sx={{ p: 2 }}>
					<Typography>Keine zuchtfähigen Hunde gefunden.</Typography>
				</Box>
			) : (
				<TableContainer component={Paper} variant='outlined'>
					<Table sx={{ minWidth: 650 }} aria-label='meine zuchthunde tabelle'>
						<TableHead>
							<TableRow>
								<TableCell>Name</TableCell>
								<TableCell>Wurfdatum</TableCell>
								<TableCell>Geschlecht</TableCell>
								<TableCell>Farbe</TableCell>
								<TableCell>Zuchtbuch-Nr.</TableCell>
								<TableCell>Chip-Nr.</TableCell>
								<TableCell align='right'>Aktionen</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{dogs.map((dog) => (
								<TableRow
									key={dog.documentId}
									sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
								>
									<TableCell component='th' scope='row'>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											{dog.fullKennelName || dog.givenName}
											{dog.isDirty && (
												<Chip
													label='Freigabe ausstehend'
													color='warning'
													size='small'
													sx={{ bgcolor: '#f59e0b', color: 'white' }}
												/>
											)}
										</Box>
									</TableCell>
									<TableCell>
										{dog.dateOfBirth ? formatDate(dog.dateOfBirth) : '-'}
									</TableCell>
									<TableCell>{dog.sex}</TableCell>
									<TableCell>{dog.color || '-'}</TableCell>
									<TableCell>{dog.cStudBookNumber || '-'}</TableCell>
									<TableCell>{dog.microchipNo || '-'}</TableCell>
									<TableCell align='right'>
										<IconButton
											aria-label={`${dog.fullKennelName || dog.givenName || 'Hund'} bearbeiten`}
											onClick={() => handleEditClick(dog)}
											size='small'
										>
											<EditIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Dialog
				open={Boolean(editingDog && editFormData)}
				onClose={handleCloseEdit}
				fullWidth
				maxWidth='md'
			>
				<DialogTitle>
					Hund bearbeiten: {editingDog?.fullKennelName || editingDog?.givenName || ''}
				</DialogTitle>
				<DialogContent dividers>
					{editingDog && editFormData && (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
							<Box>
								<Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
									Persönliche Worte (veröffentlicht)
								</Typography>
								{editingDog.MemosReleased ? (
									<Box
										sx={{
											border: '1px solid #eee',
											p: 1.5,
											borderRadius: 1,
											bgcolor: 'background.default',
											maxHeight: 200,
											overflow: 'auto',
											'& p': { m: 0, mb: 1 },
											'& p:last-child': { mb: 0 },
										}}
										dangerouslySetInnerHTML={{ __html: editingDog.MemosReleased }}
									/>
								) : (
									<Typography variant='body1'>-</Typography>
								)}
							</Box>

							<HtmlRichTextEditor
								key={editingDog.documentId}
								label='Persönliche Worte (Entwurf)'
								value={editFormData.MemosDraft}
								onChange={(html) => setEditFormData({
									...editFormData,
									MemosDraft: html,
								})}
							/>

							<TextField
								label='Rufname'
								value={editingDog.givenName || ''}
								fullWidth
								size='small'
								InputProps={{ readOnly: true }}
								sx={{ bgcolor: 'action.disabledBackground' }}
							/>

							<TextField
								label="Nachricht an's TIK"
								fullWidth
								multiline
								rows={4}
								value={editFormData.DogOwnersMessage}
								onChange={(event) => setEditFormData({
									...editFormData,
									DogOwnersMessage: event.target.value,
								})}
							/>

							<FormControlLabel
								control={
									<Switch
										checked={editFormData.isDirty}
										onChange={(event) => setEditFormData({
											...editFormData,
											isDirty: event.target.checked,
										})}
										color='primary'
									/>
								}
								label='Meine Änderungen bitte freigeben'
							/>

							{saveMessage && (
								<Alert severity={saveMessage.type === 'success' ? 'success' : 'error'}>
									{saveMessage.text}
								</Alert>
							)}
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseEdit} disabled={isSaving}>
						Abbrechen
					</Button>
					<Button
						variant='contained'
						onClick={handleSave}
						disabled={isSaving}
						sx={{ bgcolor: '#facc15', color: 'black', '&:hover': { bgcolor: '#eab308' } }}
					>
						{isSaving ? 'Speichere...' : 'Speichern'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import {
	Alert,
	Box,
	Button,
	Pagination,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material'
import { ViewToggle } from '@/components/common/view-toggle'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import {
	deleteTikPhotoboxCollection,
	deleteTikPhotoboxImage,
	searchTikPhotobox,
	tikPhotoboxDownloadUrl,
	type TikPhotoboxCollection,
	type TikPhotoboxPageInfo,
	type TikPhotoboxPhoto,
} from '@/lib/tik-photobox'
import { theme } from '@/themes'

interface PhotoboxTabProps {
	strapiBaseUrl?: string | null
}

type PageSize = 5 | 10 | 20 | 50 | 100
type ViewMode = 'cards' | 'table'

const EMPTY_PAGE: TikPhotoboxPageInfo = {
	page: 1,
	pageSize: 10,
	pageCount: 0,
	total: 0,
}

function formatWhen(value: string | null): string {
	if (!value) {
		return '–'
	}
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return '–'
	}
	return new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date)
}

function showText(value: string | null | undefined): string {
	const trimmed = value?.trim()
	return trimmed ? trimmed : '–'
}

function mediaSrc(
	url: string | null,
	baseUrl?: string | null,
): string | null {
	if (!url) {
		return null
	}
	const resolved = resolveMediaUrl({ url }, baseUrl ?? '')
	if (!resolved) {
		return null
	}
	if (resolved.includes('//strapi:1337')) {
		return resolved.replace('//strapi:1337', '//localhost:1337')
	}
	return resolved
}

function membershipLabel(
	collection: TikPhotoboxCollection,
): string {
	const number = collection.photographer?.membershipNumber
	if (typeof number === 'number') {
		return String(number)
	}
	return '–'
}

function PhotoThumbnail({
	photo,
	strapiBaseUrl,
	size,
}: {
	photo: TikPhotoboxPhoto
	strapiBaseUrl?: string | null
	size: number
}) {
	const src = mediaSrc(photo.thumbnailUrl, strapiBaseUrl)
	if (!src) {
		return (
			<Box
				sx={{
					width: size,
					height: size,
					borderRadius: 1,
					bgcolor: 'grey.100',
					color: 'text.secondary',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: 12,
					textAlign: 'center',
					px: 1,
				}}
			>
				Kein Vorschaubild
			</Box>
		)
	}

	return (
		<Box
			component='img'
			src={src}
			alt={
				photo.renderedPersons
				|| photo.renderedDogs
				|| 'Vorschaubild'
			}
			sx={{
				width: size,
				height: size,
				objectFit: 'cover',
				borderRadius: 1,
				bgcolor: 'grey.100',
			}}
		/>
	)
}

function DownloadButton({ photo }: { photo: TikPhotoboxPhoto }) {
	if (!photo.hasOriginal) {
		return (
			<Button size='small' disabled>
				Original
			</Button>
		)
	}

	return (
		<Button
			size='small'
			component='a'
			href={tikPhotoboxDownloadUrl(photo.documentId)}
		>
			Original
		</Button>
	)
}

function Field({
	label,
	value,
}: {
	label: string
	value: string
}) {
	return (
		<Box>
			<Typography variant='caption' color='text.secondary'>
				{label}
			</Typography>
			<Typography variant='body2'>{value}</Typography>
		</Box>
	)
}

export function PhotoboxTab({ strapiBaseUrl }: PhotoboxTabProps) {
	const [membershipInput, setMembershipInput] = useState('')
	const [termInput, setTermInput] = useState('')
	const [membership, setMembership] = useState('')
	const [term, setTerm] = useState('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [viewMode, setViewMode] = useState<ViewMode>('table')
	const [collections, setCollections] = useState<TikPhotoboxCollection[]>([])
	const [pageInfo, setPageInfo] = useState<TikPhotoboxPageInfo>(EMPTY_PAGE)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)
	const [noticeIsWarning, setNoticeIsWarning] = useState(false)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [reloadToken, setReloadToken] = useState(0)

	useEffect(() => {
		const timer = setTimeout(() => {
			setMembership(membershipInput.trim())
			setTerm(termInput.trim())
			setPage(1)
		}, 400)
		return () => clearTimeout(timer)
	}, [membershipInput, termInput])

	useEffect(() => {
		let active = true

		async function load() {
			if (membership && !/^\d+$/.test(membership)) {
				setError('Mitgliedsnummer muss eine Zahl sein.')
				setCollections([])
				setPageInfo(EMPTY_PAGE)
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError(null)
			try {
				const result = await searchTikPhotobox({
					membershipNumber: membership || undefined,
					term: term || undefined,
					page,
					pageSize,
				})
				if (!active) {
					return
				}
				if (
					result.collections.length === 0
					&& result.pageInfo.total > 0
					&& page > 1
				) {
					setPage(page - 1)
					return
				}
				setCollections(result.collections)
				setPageInfo(result.pageInfo)
			} catch (loadError) {
				if (!active) {
					return
				}
				setCollections([])
				setPageInfo(EMPTY_PAGE)
				setError(
					loadError instanceof Error
						? loadError.message
						: 'Photobox-Daten konnten nicht geladen werden.',
				)
			} finally {
				if (active) {
					setIsLoading(false)
				}
			}
		}

		void load()
		return () => {
			active = false
		}
	}, [membership, term, page, pageSize, reloadToken])

	const handleDeleteImage = useCallback(async (photo: TikPhotoboxPhoto) => {
		const label = photo.fileName || photo.documentId
		const confirmed = window.confirm(
			`Bild „${label}“ und die Originaldatei wirklich löschen?`,
		)
		if (!confirmed) {
			return
		}
		setDeletingId(photo.documentId)
		setNotice(null)
		try {
			const result = await deleteTikPhotoboxImage(photo.documentId)
			setNoticeIsWarning(result.warnings.length > 0)
			setNotice(
				result.warnings.length > 0
					? `${result.message} ${result.warnings.join(' ')}`
					: result.message,
			)
			setReloadToken((current) => current + 1)
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: 'Bild konnte nicht gelöscht werden.',
			)
		} finally {
			setDeletingId(null)
		}
	}, [])

	const handleDeleteCollection = useCallback(async (
		collection: TikPhotoboxCollection,
	) => {
		const label = collection.description || collection.documentId
		const confirmed = window.confirm(
			`Sammlung „${label}“ inklusive aller Bilder und `
			+ 'Originaldateien wirklich löschen?',
		)
		if (!confirmed) {
			return
		}
		setDeletingId(collection.documentId)
		setNotice(null)
		try {
			const result = await deleteTikPhotoboxCollection(
				collection.documentId,
			)
			setNoticeIsWarning(result.warnings.length > 0)
			setNotice(
				result.warnings.length > 0
					? `${result.message} ${result.warnings.join(' ')}`
					: result.message,
			)
			setReloadToken((current) => current + 1)
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: 'Sammlung konnte nicht gelöscht werden.',
			)
		} finally {
			setDeletingId(null)
		}
	}, [])

	const rangeStart = pageInfo.total === 0
		? 0
		: ((pageInfo.page - 1) * pageInfo.pageSize) + 1
	const rangeEnd = Math.min(
		pageInfo.page * pageInfo.pageSize,
		pageInfo.total,
	)

	return (
		<Box>
			<Box
				component='form'
				onSubmit={(event) => {
					event.preventDefault()
					setMembership(membershipInput.trim())
					setTerm(termInput.trim())
					setPage(1)
				}}
				sx={{
					display: 'grid',
					alignItems: 'flex-start',
					gridTemplateColumns: {
						xs: '1fr',
						md: '220px 1fr auto',
					},
					gap: 2,
					mb: 2,
				}}
			>
				<TextField
					label='Mitgliedsnummer'
					value={membershipInput}
					onChange={(event) => setMembershipInput(event.target.value)}
					size='small'
					inputMode='numeric'
				/>
				<TextField
					label='Suchwort'
					value={termInput}
					onChange={(event) => setTermInput(event.target.value)}
					size='small'
					helperText={
						'Beschreibung, Ort, Personen, Hunde oder Nachricht'
					}
				/>
				<Button type='submit' variant='contained' sx={{ height: 40 }}>
					Suchen
				</Button>
			</Box>

			{error ? (
				<Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>
			) : null}
			{notice ? (
				<Alert
					severity={noticeIsWarning ? 'warning' : 'success'}
					sx={{ mb: 2 }}
				>
					{notice}
				</Alert>
			) : null}

			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 2,
					mb: 2,
				}}
			>
				<Typography variant='body2' color='text.secondary'>
					{pageInfo.total > 0
						? `Zeige ${rangeStart} bis ${rangeEnd} von ${pageInfo.total} Sammlungen`
						: 'Keine Sammlungen gefunden'}
				</Typography>
				<ViewToggle
					viewMode={viewMode}
					onViewModeChange={setViewMode}
				/>
				{pageInfo.pageCount > 1 ? (
					<Pagination
						count={pageInfo.pageCount}
						page={page}
						onChange={(_, value) => setPage(value)}
						disabled={isLoading}
						color='primary'
						size='small'
						showFirstButton
						showLastButton
						sx={{
							'& .MuiPaginationItem-page.Mui-selected': {
								backgroundColor: theme.submitButtonColor,
								color: theme.submitButtonTextColor,
							},
						}}
					/>
				) : <span />}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Typography
						component='label'
						htmlFor='tik-photobox-page-size'
						variant='body2'
						color='text.secondary'
					>
						Pro Seite:
					</Typography>
					<select
						id='tik-photobox-page-size'
						value={pageSize}
						onChange={(event) => {
							setPageSize(Number(event.target.value) as PageSize)
							setPage(1)
						}}
						className='rounded border border-gray-300 px-2 py-1 text-sm'
					>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={20}>20</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</Box>
			</Box>

			{isLoading ? (
				<Typography color='text.secondary'>Lade Sammlungen…</Typography>
			) : null}

			{!isLoading && viewMode === 'table' ? (
				<PhotoboxTable
					collections={collections}
					strapiBaseUrl={strapiBaseUrl}
					deletingId={deletingId}
					onDeleteImage={handleDeleteImage}
					onDeleteCollection={handleDeleteCollection}
				/>
			) : null}

			{!isLoading && viewMode === 'cards' ? (
				<PhotoboxCards
					collections={collections}
					strapiBaseUrl={strapiBaseUrl}
					deletingId={deletingId}
					onDeleteImage={handleDeleteImage}
					onDeleteCollection={handleDeleteCollection}
				/>
			) : null}
		</Box>
	)
}

interface ResultProps {
	collections: TikPhotoboxCollection[]
	strapiBaseUrl?: string | null
	deletingId: string | null
	onDeleteImage: (photo: TikPhotoboxPhoto) => void
	onDeleteCollection: (collection: TikPhotoboxCollection) => void
}

function PhotoboxTable({
	collections,
	strapiBaseUrl,
	deletingId,
	onDeleteImage,
	onDeleteCollection,
}: ResultProps) {
	if (collections.length === 0) {
		return null
	}

	return (
		<TableContainer
			component={Paper}
			variant='outlined'
			sx={{ overflowX: 'auto' }}
		>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>Beschreibung</TableCell>
						<TableCell>Ort</TableCell>
						<TableCell>Mitgliedsnummer</TableCell>
						<TableCell>Fotograf</TableCell>
						<TableCell>Bilder</TableCell>
						<TableCell>Angelegt</TableCell>
						<TableCell>Aktion</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{collections.map((collection) => (
						<Fragment key={collection.documentId}>
							<TableRow sx={{ bgcolor: 'grey.50' }}>
								<TableCell>
									{showText(collection.description)}
								</TableCell>
								<TableCell>
									{showText(collection.location)}
								</TableCell>
								<TableCell>
									{membershipLabel(collection)}
								</TableCell>
								<TableCell>
									{showText(collection.photographer?.displayName)}
								</TableCell>
								<TableCell>{collection.photos.length}</TableCell>
								<TableCell>
									{formatWhen(collection.createdAt)}
								</TableCell>
								<TableCell>
									<Button
										size='small'
										color='error'
										disabled={deletingId === collection.documentId}
										onClick={() => onDeleteCollection(collection)}
									>
										Sammlung löschen
									</Button>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell colSpan={7} sx={{ py: 1.5 }}>
									{collection.photos.length === 0 ? (
										<Typography
											variant='body2'
											color='text.secondary'
										>
											Keine Bilder in dieser Sammlung.
										</Typography>
									) : (
										<Table size='small'>
											<TableHead>
												<TableRow>
													<TableCell>Nachricht</TableCell>
													<TableCell>Datei</TableCell>
													<TableCell>Angelegt</TableCell>
													<TableCell>Aktion</TableCell>
													<TableCell>Personen</TableCell>
													<TableCell>Hunde</TableCell>
													<TableCell align='right'>
														Thumbnail
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{collection.photos.map((photo) => (
													<TableRow key={photo.documentId}>
														<TableCell>
															{showText(photo.userMessage)}
														</TableCell>
														<TableCell>
															{showText(photo.fileName)}
														</TableCell>
														<TableCell>
															{formatWhen(photo.createdAt)}
														</TableCell>
														<TableCell>
															<Box
																sx={{
																	display: 'flex',
																	gap: 1,
																	flexWrap: 'wrap',
																}}
															>
																<DownloadButton photo={photo} />
																<Button
																	size='small'
																	color='error'
																	disabled={
																		deletingId === photo.documentId
																	}
																	onClick={() => onDeleteImage(photo)}
																>
																	Löschen
																</Button>
															</Box>
														</TableCell>
														<TableCell>
															{showText(photo.renderedPersons)}
														</TableCell>
														<TableCell>
															{showText(photo.renderedDogs)}
														</TableCell>
														<TableCell align='right'>
															<Box
																sx={{
																	display: 'flex',
																	justifyContent: 'flex-end',
																}}
															>
																<PhotoThumbnail
																	photo={photo}
																	strapiBaseUrl={strapiBaseUrl}
																	size={88}
																/>
															</Box>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									)}
								</TableCell>
							</TableRow>
						</Fragment>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	)
}

function PhotoboxCards({
	collections,
	strapiBaseUrl,
	deletingId,
	onDeleteImage,
	onDeleteCollection,
}: ResultProps) {
	if (collections.length === 0) {
		return null
	}

	return (
		<Box sx={{ display: 'grid', gap: 2 }}>
			{collections.map((collection) => (
				<Paper key={collection.documentId} variant='outlined' sx={{ p: 2 }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							gap: 2,
							flexWrap: 'wrap',
							mb: 2,
						}}
					>
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: {
									xs: '1fr',
									sm: 'repeat(4, minmax(0, 1fr))',
								},
								gap: 2,
								flex: 1,
							}}
						>
							<Field
								label='Beschreibung'
								value={showText(collection.description)}
							/>
							<Field label='Ort' value={showText(collection.location)} />
							<Field
								label='Mitgliedsnummer'
								value={membershipLabel(collection)}
							/>
							<Field
								label='Fotograf'
								value={showText(collection.photographer?.displayName)}
							/>
						</Box>
						<Button
							size='small'
							color='error'
							disabled={deletingId === collection.documentId}
							onClick={() => onDeleteCollection(collection)}
						>
							Sammlung löschen
						</Button>
					</Box>
					{collection.photos.length === 0 ? (
						<Typography variant='body2' color='text.secondary'>
							Keine Bilder in dieser Sammlung.
						</Typography>
					) : (
						<Box sx={{ display: 'grid', gap: 2 }}>
							{collection.photos.map((photo) => (
								<Box
									key={photo.documentId}
									sx={{
										display: 'flex',
										gap: 2,
										alignItems: 'flex-start',
										borderTop: '1px solid',
										borderColor: 'divider',
										pt: 2,
									}}
								>
									<PhotoThumbnail
										photo={photo}
										strapiBaseUrl={strapiBaseUrl}
										size={140}
									/>
									<Box sx={{ flex: 1, display: 'grid', gap: 1 }}>
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: {
													xs: '1fr',
													md: 'repeat(3, minmax(0, 1fr))',
												},
												gap: 1.5,
											}}
										>
											<Field
												label='Beschreibung'
												value={showText(collection.description)}
											/>
											<Field
												label='Ort'
												value={showText(collection.location)}
											/>
											<Field
												label='Mitgliedsnummer'
												value={membershipLabel(collection)}
											/>
											<Field
												label='Personen'
												value={showText(photo.renderedPersons)}
											/>
											<Field
												label='Hunde'
												value={showText(photo.renderedDogs)}
											/>
											<Field
												label='Nachricht'
												value={showText(photo.userMessage)}
											/>
											<Field
												label='Datei'
												value={showText(photo.fileName)}
											/>
											<Field
												label='Angelegt'
												value={formatWhen(photo.createdAt)}
											/>
										</Box>
										<Box sx={{ display: 'flex', gap: 1 }}>
											<DownloadButton photo={photo} />
											<Button
												size='small'
												color='error'
												disabled={deletingId === photo.documentId}
												onClick={() => onDeleteImage(photo)}
											>
												Löschen
											</Button>
										</Box>
									</Box>
								</Box>
							))}
						</Box>
					)}
				</Paper>
			))}
		</Box>
	)
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	Box,
	Button,
	Checkbox,
	Chip,
	Collapse,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	TextField,
	type SelectChangeEvent,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import type { ThemeDefinition } from '@/themes'
import type { NewsArticleTag } from '@/types'
import { fetchNewsArticleTagsByCategory } from '@/lib/strapi/api'
import { resolveTagColors } from '@/lib/color-utils'

export interface CollapsibleSearchCriteria {
	searchPhrase: string
	newsArticleTagIds: string[]
}

export interface CollapsibleSearchPanelProps {
	theme: ThemeDefinition
	/** Kategorie, aus deren Artikeln die Tag-Optionen geladen werden */
	categoryDocumentId: string
	placeholder?: string
	searchButtonLabel?: string
	tagSelectLabel?: string
	/** Aktive Suchkriterien (Anzeige außerhalb des Panels) */
	activeCriteria?: CollapsibleSearchCriteria
	onSearch: (criteria: CollapsibleSearchCriteria) => void
	onClearActiveSearch?: () => void
}

/**
 * Wiederverwendbare Suchleiste: standardmäßig eingeklappt.
 * Lupe öffnet die Dialogfläche; Suche schließt sie und feuert onSearch;
 * X schließt ohne Suche.
 */
export function CollapsibleSearchPanel({
	theme,
	categoryDocumentId,
	placeholder = 'Suchtext eingeben…',
	searchButtonLabel = 'Suchen',
	tagSelectLabel = 'Tags',
	activeCriteria,
	onSearch,
	onClearActiveSearch,
}: CollapsibleSearchPanelProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [draftPhrase, setDraftPhrase] = useState('')
	const [draftTagIds, setDraftTagIds] = useState<string[]>([])
	const [availableTags, setAvailableTags] = useState<NewsArticleTag[]>([])
	const [isLoadingTags, setIsLoadingTags] = useState(false)

	const activePhrase = activeCriteria?.searchPhrase?.trim() ?? ''
	const activeTagIdsKey = (activeCriteria?.newsArticleTagIds ?? []).join(',')
	const activeTagIds = useMemo(
		() => (activeTagIdsKey ? activeTagIdsKey.split(',') : []),
		[activeTagIdsKey],
	)
	const hasActiveSearch = activePhrase.length > 0 || activeTagIds.length > 0

	const tagsById = useMemo(() => {
		const map = new Map<string, NewsArticleTag>()
		for (const tag of availableTags) {
			map.set(tag.documentId, tag)
		}
		return map
	}, [availableTags])

	useEffect(() => {
		const categoryId = categoryDocumentId.trim()
		if (!categoryId) {
			setAvailableTags([])
			return
		}

		let cancelled = false
		setIsLoadingTags(true)
		void fetchNewsArticleTagsByCategory(categoryId)
			.then((tags) => {
				if (!cancelled) {
					setAvailableTags(tags)
				}
			})
			.catch((error) => {
				console.error('Tags konnten nicht geladen werden:', error)
				if (!cancelled) {
					setAvailableTags([])
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoadingTags(false)
				}
			})

		return () => {
			cancelled = true
		}
	}, [categoryDocumentId])

	useEffect(() => {
		if (isOpen) {
			setDraftPhrase(activePhrase)
			setDraftTagIds(activeTagIds)
		}
	}, [isOpen, activePhrase, activeTagIds])

	const handleOpen = useCallback(() => {
		setIsOpen(true)
	}, [])

	const handleClose = useCallback(() => {
		setIsOpen(false)
		setDraftPhrase(activePhrase)
		setDraftTagIds(activeTagIds)
	}, [activePhrase, activeTagIds])

	const handleTagChange = useCallback((event: SelectChangeEvent<string[]>) => {
		const value = event.target.value
		setDraftTagIds(typeof value === 'string' ? value.split(',') : value)
	}, [])

	const handleSubmit = useCallback(() => {
		const criteria: CollapsibleSearchCriteria = {
			searchPhrase: draftPhrase.trim(),
			newsArticleTagIds: draftTagIds,
		}
		setIsOpen(false)
		onSearch(criteria)
	}, [draftPhrase, draftTagIds, onSearch])

	const activeTagLabels = activeTagIds
		.map((id) => tagsById.get(id)?.Label ?? id)
		.filter(Boolean)

	return (
		<Box sx={{ width: '100%' }}>
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'flex-end',
					gap: 1,
					flexWrap: 'wrap',
					mb: isOpen ? 1 : 0,
				}}
			>
				{hasActiveSearch ? (
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 0.5,
							px: 1.5,
							py: 0.5,
							borderRadius: 1,
							backgroundColor: theme.submitButtonColor + '18',
							color: theme.headlineColor,
							fontSize: '0.875rem',
							maxWidth: '100%',
							flexWrap: 'wrap',
						}}
					>
						{activePhrase ? (
							<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								Suche: „{activePhrase}“
							</span>
						) : null}
						{activeTagLabels.length > 0 ? (
							<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{activePhrase ? ' · ' : ''}
								Tags: {activeTagLabels.join(', ')}
							</span>
						) : null}
						{onClearActiveSearch ? (
							<IconButton
								size='small'
								aria-label='Suche zurücksetzen'
								onClick={onClearActiveSearch}
								sx={{ color: theme.buttonColor }}
							>
								<CloseIcon fontSize='small' />
							</IconButton>
						) : null}
					</Box>
				) : null}

				{!isOpen ? (
					<IconButton
						aria-label='Suche öffnen'
						onClick={handleOpen}
						sx={{
							color: theme.buttonColor,
							border: `1px solid ${theme.buttonColor}40`,
							borderRadius: 1,
						}}
					>
						<SearchIcon />
					</IconButton>
				) : null}
			</Box>

			<Collapse in={isOpen} timeout='auto' unmountOnExit>
				<Box
					component='form'
					onSubmit={(event) => {
						event.preventDefault()
						handleSubmit()
					}}
					sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 1.5,
						p: 2,
						mb: 1,
						borderRadius: 2,
						border: `1px solid ${theme.buttonColor}40`,
						backgroundColor: 'white',
						boxShadow: '0 2px 8px rgb(0 0 0 / 0.06)',
					}}
				>
					<TextField
						autoFocus
						fullWidth
						size='small'
						placeholder={placeholder}
						value={draftPhrase}
						onChange={(event) => setDraftPhrase(event.target.value)}
						sx={{
							'& .MuiOutlinedInput-root': {
								'& fieldset': { borderColor: theme.buttonColor + '40' },
								'&:hover fieldset': { borderColor: theme.buttonColor },
								'&.Mui-focused fieldset': { borderColor: theme.buttonColor },
							},
						}}
					/>

					<FormControl fullWidth size='small'>
						<InputLabel id='collapsible-search-tags-label'>{tagSelectLabel}</InputLabel>
						<Select
							labelId='collapsible-search-tags-label'
							multiple
							value={draftTagIds}
							onChange={handleTagChange}
							input={<OutlinedInput label={tagSelectLabel} />}
							disabled={isLoadingTags || availableTags.length === 0}
							renderValue={(selected) => (
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
									{selected.map((id) => {
										const tag = tagsById.get(id)
										if (!tag?.Label) {
											return null
										}
										const { color, backgroundColor } = resolveTagColors(tag)
										return (
											<Chip
												key={id}
												label={tag.Label}
												size='small'
												sx={{
													backgroundColor,
													color,
													fontWeight: 600,
													height: 22,
												}}
											/>
										)
									})}
								</Box>
							)}
						>
							{availableTags.map((tag) => {
								const { color, backgroundColor } = resolveTagColors(tag)
								return (
									<MenuItem key={tag.documentId} value={tag.documentId}>
										<Checkbox checked={draftTagIds.includes(tag.documentId)} />
										<Chip
											label={tag.Label ?? tag.documentId}
											size='small'
											sx={{
												backgroundColor,
												color,
												fontWeight: 600,
												height: 22,
												ml: 0.5,
											}}
										/>
									</MenuItem>
								)
							})}
						</Select>
					</FormControl>

					<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
						<Button
							type='submit'
							variant='contained'
							startIcon={<SearchIcon />}
							sx={{
								backgroundColor: theme.submitButtonColor,
								color: theme.submitButtonTextColor,
								textTransform: 'none',
								'&:hover': {
									backgroundColor: theme.submitButtonColor,
									filter: 'brightness(90%)',
								},
							}}
						>
							{searchButtonLabel}
						</Button>
						<IconButton
							aria-label='Suche schließen'
							onClick={handleClose}
							sx={{ color: theme.buttonColor }}
						>
							<CloseIcon />
						</IconButton>
					</Box>
				</Box>
			</Collapse>
		</Box>
	)
}

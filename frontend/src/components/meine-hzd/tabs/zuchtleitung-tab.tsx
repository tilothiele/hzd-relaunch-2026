'use client'

import { useCallback, useEffect, useState } from 'react'
import {
	Alert,
	Box,
	CircularProgress,
	FormControlLabel,
	Paper,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material'
import { fetchZuchtleitungBreeders, setBreederDisable } from '@/lib/strapi/api'
import { SearchResultPager, SearchPageSize } from '@/components/common/search-result-pager'
import type { Breeder } from '@/types'

interface ZuchtleitungTabProps {
	strapiBaseUrl?: string | null
}

type BreederRoleFilter = 'B' | 'S'

export function ZuchtleitungTab({ strapiBaseUrl }: ZuchtleitungTabProps) {
	const [items, setItems] = useState<Breeder[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const [role, setRole] = useState<BreederRoleFilter>('B')
	const [disabledOnly, setDisabledOnly] = useState(false)
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<SearchPageSize>(10)
	const [pageCount, setPageCount] = useState(1)

	const [savingId, setSavingId] = useState<string | null>(null)
	const [saveError, setSaveError] = useState<string | null>(null)

	// Suche greift erst ab 3 Zeichen (Teilstring, Zwingername/FullName)
	const activeSearch = search.trim().length >= 3 ? search.trim() : ''

	const loadData = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const result = await fetchZuchtleitungBreeders({
				role,
				disabledOnly,
				q: activeSearch || undefined,
				page,
				pageSize,
			})
			setItems(result.items)
			setPageCount(result.pagination.pageCount)
		} catch (err) {
			console.error('Failed to load zuchtleitung breeders:', err)
			setItems([])
			setError('Die Zwingerliste konnte nicht geladen werden.')
		} finally {
			setLoading(false)
		}
	}, [role, disabledOnly, activeSearch, page, pageSize, strapiBaseUrl])

	useEffect(() => {
		loadData()
	}, [loadData])

	const handleRoleChange = (checked: boolean) => {
		setRole(checked ? 'S' : 'B')
		setPage(1)
		setSaveError(null)
	}

	const handleDisabledOnlyChange = (checked: boolean) => {
		setDisabledOnly(checked)
		setPage(1)
		setSaveError(null)
	}

	const handleSearchChange = (value: string) => {
		setSearch(value)
		setPage(1)
		setSaveError(null)
	}

	const handleToggleDisable = async (breeder: Breeder, next: boolean) => {
		if (savingId) {
			return
		}

		const previous = breeder.Disable === true
		setSavingId(breeder.documentId)
		setSaveError(null)
		setItems((current) => current.map((item) => (
			item.documentId === breeder.documentId
				? { ...item, Disable: next }
				: item
		)))

		try {
			await setBreederDisable(breeder.documentId, next)

			// Bei aktivem "nur ausgeblendete Züchter"-Filter verschwindet
			// ein reaktivierter Zwinger aus der Liste - daher neu laden.
			if (disabledOnly && !next) {
				await loadData()
			}
		} catch (err) {
			console.error('Failed to toggle breeder Disable:', err)
			setItems((current) => current.map((item) => (
				item.documentId === breeder.documentId
					? { ...item, Disable: previous }
					: item
			)))
			setSaveError('Die Änderung konnte nicht gespeichert werden.')
		} finally {
			setSavingId(null)
		}
	}

	if (loading && items.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress />
			</Box>
		)
	}

	return (
		<Box>
			<Box sx={{ mb: 2 }}>
				<Typography variant='h6'>Zuchtleitung</Typography>
				<Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
					Aktive Zwinger verwalten (Deaktivieren/Reaktivieren).
				</Typography>
			</Box>

			<Box sx={{ mb: 2 }}>
				<TextField
					label='Suche (min. 3 Zeichen)'
					placeholder='Zwingername oder FullName'
					size='small'
					value={search}
					onChange={(event) => handleSearchChange(event.target.value)}
					inputProps={{ 'aria-label': 'Suche nach Zwingername oder FullName' }}
					sx={{ maxWidth: 360 }}
				/>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gapX: 3, gapY: 1, mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<Typography
						variant='body2'
						color={role === 'B' ? 'text.primary' : 'text.secondary'}
						sx={{ fontWeight: role === 'B' ? 600 : 400 }}
					>
						Züchter
					</Typography>
					<Switch
						checked={role === 'S'}
						onChange={(event) => handleRoleChange(event.target.checked)}
						color='primary'
						aria-label='Deckrüdenbesitzer oder Züchter'
					/>
					<Typography
						variant='body2'
						color={role === 'S' ? 'text.primary' : 'text.secondary'}
						sx={{ fontWeight: role === 'S' ? 600 : 400 }}
					>
						Deckrüdenbesitzer
					</Typography>
				</Box>

				<Box sx={{ ml: 'auto' }}>
					<FormControlLabel
						control={
							<Switch
								checked={disabledOnly}
								onChange={(event) => handleDisabledOnlyChange(event.target.checked)}
								color='warning'
							/>
						}
						label='Nur ausgeblendete Züchter (Deaktiviert)'
					/>
				</Box>
			</Box>

			{saveError && (
				<Box sx={{ mb: 2 }}>
					<Alert severity='error'>{saveError}</Alert>
				</Box>
			)}

			{error ? (
				<Box sx={{ p: 2 }}>
					<Alert severity='error'>{error}</Alert>
				</Box>
			) : items.length === 0 ? (
				<Box sx={{ p: 2 }}>
					<Typography>
						{activeSearch
							? <>Keine aktiven Zwinger gefunden (Suche: „{activeSearch}“).</>
							: 'Keine aktiven Zwinger gefunden.'}
					</Typography>
				</Box>
			) : (
				<TableContainer component={Paper} variant='outlined'>
					<Table sx={{ minWidth: 600 }} aria-label='zuchtleitung zwinger tabelle'>
						<TableHead>
							<TableRow>
								<TableCell>Zwinger</TableCell>
								<TableCell>FullName</TableCell>
								<TableCell align='right'>Deaktiviert</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{items.map((breeder) => {
								const isDisabled = breeder.Disable === true
								return (
									<TableRow
										key={breeder.documentId}
										sx={{
											'&:last-child td, &:last-child th': { border: 0 },
											...(isDisabled ? { opacity: 0.7 } : {}),
										}}
									>
										<TableCell component='th' scope='row'>
											{breeder.kennelName || '-'}
										</TableCell>
										<TableCell>
											{breeder.Address?.FullName || '-'}
										</TableCell>
										<TableCell align='right'>
											<Switch
												checked={isDisabled}
												onChange={(event) => handleToggleDisable(breeder, event.target.checked)}
												disabled={savingId === breeder.documentId}
												color={isDisabled ? 'error' : 'default'}
												inputProps={{
													'aria-label': `Zwinger ${breeder.kennelName ?? ''} ${isDisabled ? 'aktivieren' : 'deaktivieren'}`,
												}}
											/>
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Box sx={{ mt: 2 }}>
				<SearchResultPager
					idPrefix='zuchtleitung-breeders'
					page={page}
					pageCount={pageCount}
					pageSize={pageSize}
					disabled={loading}
					onPageChange={setPage}
					onPageSizeChange={(size) => {
						setPageSize(size)
						setPage(1)
					}}
				/>
			</Box>
		</Box>
	)
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { TextField, Select, MenuItem, Button, FormControl, InputLabel, Box, Switch, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, ToggleButtonGroup, ToggleButton, Tooltip, FormControlLabel } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import MaleIcon from '@mui/icons-material/Male'
import FemaleIcon from '@mui/icons-material/Female'

import type { Litter, HzdSetting, GeoLocation } from '@/types'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { MeinePlz } from '@/components/hzd-map/meine-plz'
import { theme } from '@/themes'
import { ViewToggle } from '@/components/common/view-toggle'
import { LitterCard } from '@/components/litter-search/litter-card'
import { LitterDetailView } from '@/components/litter-search/litter-detail-view'
import { calculateDistance } from '@/lib/geo-utils'
import { useLitters, type LitterStatus, type PageSize } from '@/hooks/use-litters'
import { SubmitButton } from '@/components/ui/submit-button'

interface LitterSearchProps {
	strapiBaseUrl: string
	hzdSetting?: HzdSetting | null
}



/**
 * Ermittelt die Position eines Wurfs (real oder fake)
 */
function getLitterLocation(litter: Litter): { lat: number; lng: number } | null {
	const member = litter.breeder?.member
	if (typeof member?.locationLat === 'number' && typeof member?.locationLng === 'number') {
		return { lat: member.locationLat, lng: member.locationLng }
	}
	return null
}

const getStatusLabel = (status: Litter['LitterStatus']) => {
	switch (status) {
		case 'Planned': return 'Geplant'
		case 'Manted': return 'Gedeckt'
		case 'Littered': return 'Geworfen'
		case 'Closed': return 'Geschlossen'
		default: return status
	}
}

const renderStatusBadge = (status: Litter['LitterStatus'], small = false) => {
	const label = getStatusLabel(status)
	let colorClasses = 'bg-gray-100 text-gray-800'

	switch (status) {
		case 'Planned':
			colorClasses = 'bg-blue-100 text-blue-800'
			break
		case 'Manted':
			colorClasses = 'bg-yellow-100 text-yellow-800'
			break
		case 'Littered':
			colorClasses = 'bg-green-100 text-green-800'
			break
		case 'Closed':
			colorClasses = 'bg-gray-200 text-gray-700'
			break
	}

	return (
		<span className={`rounded font-medium uppercase ${colorClasses} ${small ? 'px-2 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>
			{label}
		</span>
	)
}

export function LitterSearch({ strapiBaseUrl, hzdSetting }: LitterSearchProps) {
	const [breederFilter, setBreederFilter] = useState('')
	const [breederInput, setBreederInput] = useState('')
	const [motherFilter, setMotherFilter] = useState('')
	const [motherInput, setMotherInput] = useState('')
	const [statusFilter, setStatusFilter] = useState<LitterStatus>('')
	const [orderLetterFilter, setOrderLetterFilter] = useState('')
	const [selectedMaleColors, setSelectedMaleColors] = useState<string[]>(['S', 'SM', 'B'])
	const [selectedFemaleColors, setSelectedFemaleColors] = useState<string[]>(['S', 'SM', 'B'])
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [selectedLitter, setSelectedLitter] = useState<Litter | null>(null)
	const [showMap, setShowMap] = useState(false)
	const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

	const filters = useMemo(() => ({
		breederFilter,
		motherFilter,
		statusFilter,
		orderLetterFilter,
		selectedMaleColors,
		selectedFemaleColors,
	}), [breederFilter, motherFilter, statusFilter, orderLetterFilter, selectedMaleColors, selectedFemaleColors])

	const {
		litters,
		totalLitters,
		pageCount,
		isLoading,
		error,
		searchLitters,
	} = useLitters({
		filters,
		pagination: {
			page,
			pageSize,
		},
		autoLoad: false,
	})



	useEffect(() => {
		const timer = setTimeout(() => {
			setBreederFilter(breederInput)
		}, 500)
		return () => clearTimeout(timer)
	}, [breederInput])

	useEffect(() => {
		const timer = setTimeout(() => {
			setMotherFilter(motherInput)
		}, 500)
		return () => clearTimeout(timer)
	}, [motherInput])

	useEffect(() => {
		void searchLitters()
	}, [searchLitters])

	const handleSearch = useCallback(() => {
		setBreederFilter(breederInput)
		setMotherFilter(motherInput)
		setPage(1)
		void searchLitters()
	}, [breederInput, motherInput, searchLitters])

	const handlePageSizeChange = useCallback((newPageSize: PageSize) => {
		setPageSize(newPageSize)
		setPage(1)
	}, [])

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage)
	}, [])

	const totalPages = pageCount
	const currentPage = page

	const formatDate = useCallback((dateString: string | null | undefined) => {
		if (!dateString) {
			return '-'
		}

		try {
			const date = new Date(dateString)
			return date.toLocaleDateString('de-DE', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
			})
		} catch {
			return dateString
		}
	}, [])

	// Konvertiere Würfe in MapItems
	const mapItems = useMemo<MapItem[]>(() => {
		return litters
			.map((litter) => {
				const location = getLitterLocation(litter)
				if (!location) return null

				const breeder = litter.breeder
				const orderLetter = litter.OrderLetter ?? ''
				const kennelName = breeder?.kennelName ?? 'Unbekannt'
				const title = `${orderLetter}-Wurf: ${kennelName}`

				return {
					id: litter.documentId,
					position: [location.lat, location.lng],
					title,
					popupContent: (
						<div>
							<strong>{title}</strong>
							{litter.dateOfBirth ? (
								<div>Geboren: {formatDate(litter.dateOfBirth)}</div>
							) : litter.expectedDateOfBirth ? (
								<div>Erwartet: {formatDate(litter.expectedDateOfBirth)}</div>
							) : null}
							<div>Status: {getStatusLabel(litter.LitterStatus)}</div>
							{breeder?.member?.zip && (
								<div>PLZ: {breeder.member.zip}</div>
							)}
						</div>
					)
				}
			})
			.filter((item) => item !== null) as MapItem[]
	}, [litters, formatDate])

	// Handle View Mode vs Detail Mode
	if (selectedLitter) {
		const distance = selectedLitter && userLocation ? (() => {
			const location = getLitterLocation(selectedLitter)
			if (location) {
				return calculateDistance(
					userLocation.lat,
					userLocation.lng,
					location.lat,
					location.lng
				)
			}
			return null
		})() : null

		return (
			<LitterDetailView
				litter={selectedLitter}
				strapiBaseUrl={strapiBaseUrl}
				hzdSetting={hzdSetting}
				distance={distance}
				onBack={() => setSelectedLitter(null)}
				formatDate={formatDate}
			/>
		)
	}

	return (
		<div className='container mx-auto px-4 py-8 animate-in fade-in duration-300'>
			<Box className='mb-8 rounded-lg bg-white p-6 shadow-md'>
				<Box className='mb-6 rounded border border-gray-100 bg-gray-50/50 p-2' sx={{ display: 'flex', justifyContent: 'flex-end' }}>
					<FormControlLabel
						control={
							<Switch
								checked={showMap}
								onChange={(e) => setShowMap(e.target.checked)}
								sx={{
									'& .MuiSwitch-switchBase.Mui-checked': {
										color: theme.submitButtonColor,
									},
									'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
										backgroundColor: theme.submitButtonColor,
									},
								}}
							/>
						}
						label='Kartenansicht'
					/>
				</Box>

				{showMap && (
					<Box sx={{ mb: 4 }}>
						<HzdMap isVisible={showMap} items={mapItems} userLocation={userLocation} height="400px" />
						<Box sx={{ mt: 2, width: { xs: '100%', md: '300px' } }}>
							<MeinePlz
								onLocationChange={setUserLocation}
								fullWidth={true}
							/>
						</Box>
					</Box>
				)}

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>

					<TextField
						label='Züchter'
						value={breederInput}
						onChange={(e) => setBreederInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleSearch()
							}
						}}
						placeholder='Zwingername'
						fullWidth
						size='small'
					/>

					<TextField
						label='Mutter'
						value={motherInput}
						onChange={(e) => setMotherInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleSearch()
							}
						}}
						placeholder='Name der Mutter'
						fullWidth
						size='small'
					/>

					<FormControl fullWidth size='small'>
						<InputLabel>Status</InputLabel>
						<Select
							value={statusFilter}
							label='Status'
							onChange={(e) => setStatusFilter(e.target.value as any)}
						>
							<MenuItem value=''>Alle</MenuItem>
							<MenuItem value='Planned'>Geplant</MenuItem>
							<MenuItem value='Manted'>Gedeckt</MenuItem>
							<MenuItem value='Littered'>Geworfen</MenuItem>
							<MenuItem value='Closed'>Geschlossen</MenuItem>
						</Select>
					</FormControl>

					<FormControl fullWidth size='small'>
						<InputLabel>Wurf</InputLabel>
						<Select
							value={orderLetterFilter}
							label='Wurf'
							onChange={(e) => setOrderLetterFilter(e.target.value)}
						>
							<MenuItem value=''>Alle</MenuItem>
							{Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
								<MenuItem key={letter} value={letter}>{letter}-Wurf</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>

				<Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', opacity: statusFilter === 'Littered' ? 1 : 0.5, pointerEvents: statusFilter === 'Littered' ? 'auto' : 'none' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Tooltip title="Rüden (♂)" arrow>
								<MaleIcon sx={{ color: '#0ea5e9', fontSize: 28 }} />
							</Tooltip>
							<ToggleButtonGroup
								value={selectedMaleColors}
								onChange={(_e, newColors: string[]) => {
									setSelectedMaleColors(newColors)
									setPage(1)
								}}
								aria-label="Filter nach Rüden-Welpenfarbe"
								size="small"
								disabled={statusFilter !== 'Littered'}
								sx={{
									"& .MuiToggleButton-root": {
										px: 2,
										fontWeight: 'bold',
										"&.Mui-selected": {
											backgroundColor: theme.submitButtonColor,
											color: theme.submitButtonTextColor,
											"&:hover": {
												backgroundColor: theme.submitButtonColor,
												filter: 'brightness(90%)',
											}
										}
									}
								}}
							>
								<Tooltip title="Schwarz" arrow>
									<ToggleButton value="S">S</ToggleButton>
								</Tooltip>
								<Tooltip title="Schwarzmarken" arrow>
									<ToggleButton value="SM">SM</ToggleButton>
								</Tooltip>
								<Tooltip title="Blond" arrow>
									<ToggleButton value="B">B</ToggleButton>
								</Tooltip>
							</ToggleButtonGroup>
						</Box>

						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Tooltip title="Hündinnen (♀)" arrow>
								<FemaleIcon sx={{ color: '#ec4899', fontSize: 28 }} />
							</Tooltip>
							<ToggleButtonGroup
								value={selectedFemaleColors}
								onChange={(_e, newColors: string[]) => {
									setSelectedFemaleColors(newColors)
									setPage(1)
								}}
								aria-label="Filter nach Hündinnen-Welpenfarbe"
								size="small"
								disabled={statusFilter !== 'Littered'}
								sx={{
									"& .MuiToggleButton-root": {
										px: 2,
										fontWeight: 'bold',
										"&.Mui-selected": {
											backgroundColor: theme.submitButtonColor,
											color: theme.submitButtonTextColor,
											"&:hover": {
												backgroundColor: theme.submitButtonColor,
												filter: 'brightness(90%)',
											}
										}
									}
								}}
							>
								<Tooltip title="Schwarz" arrow>
									<ToggleButton value="S">S</ToggleButton>
								</Tooltip>
								<Tooltip title="Schwarzmarken" arrow>
									<ToggleButton value="SM">SM</ToggleButton>
								</Tooltip>
								<Tooltip title="Blond" arrow>
									<ToggleButton value="B">B</ToggleButton>
								</Tooltip>
							</ToggleButtonGroup>
						</Box>
					</Box>

					<SubmitButton
						label="Suchen"
						loadingLabel="Suche..."
						onClick={handleSearch}
						isLoading={isLoading}
					/>
				</Box>
			</Box>

			{error ? (
				<div className='mb-4 rounded bg-red-50 p-4 text-sm text-red-800'>
					{error.message}
				</div>
			) : null}

			<div className='mb-4 flex items-center justify-between'>
				<div className='flex items-center gap-6'>
					<div className='text-sm text-gray-600'>
						{totalLitters > 0 ? (
							<>
								Zeige {((currentPage - 1) * pageSize) + 1} bis{' '}
								{Math.min(currentPage * pageSize, totalLitters)} von {totalLitters} Würfen
							</>
						) : (
							'Keine Würfe gefunden'
						)}
					</div>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
					</Box>
				</div>
				<div className='flex items-center gap-2'>
					<label
						htmlFor='page-size'
						className='text-sm text-gray-600'
					>
						Pro Seite:
					</label>
					<select
						id='page-size'
						value={pageSize}
						onChange={(e) => handlePageSizeChange(Number(e.target.value) as PageSize)}
						className='rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none'
						style={{ borderColor: 'transparent', outlineColor: theme.submitButtonColor }}
					>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={20}>20</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
					</select>
				</div>
			</div>

			{isLoading ? (
				<div className='text-center py-8 text-gray-600'>
					Lade Würfe...
				</div>
			) : litters.length > 0 ? (
				<>
					{viewMode === 'cards' ? (
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{litters.map((litter) => {
								let distance: number | null = null
								if (userLocation) {
									const location = getLitterLocation(litter)
									if (location) {
										distance = calculateDistance(
											userLocation.lat,
											userLocation.lng,
											location.lat,
											location.lng
										)
									}
								}

								return (
									<LitterCard
										key={litter.documentId}
										litter={litter}
										strapiBaseUrl={strapiBaseUrl}
										hzdSetting={hzdSetting}
										distance={distance}
										formatDate={formatDate}
										onClick={() => setSelectedLitter(litter)}
									/>
								)
							})}
						</div>

					) : (
						<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
							<Table size="small">
								<TableHead sx={{ backgroundColor: '#f9fafb' }}>
									<TableRow>
										<TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Wurf-Nr.</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Zwinger</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Entfernung</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Mutter</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Deckrüde</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Erw. Geb. Datum</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>Geburtsdatum</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">S (R / H)</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">SM (R / H)</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }} align="center">B (R / H)</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{litters.map((litter) => {
										const orderLetter = litter.OrderLetter ?? ''
										const kennelName = litter.breeder?.kennelName ?? 'Kein Zwingername bekannt'
										const breederMember = (litter.breeder?.member?.firstName || '') + ' ' + (litter.breeder?.member?.lastName || '')
										const motherName = litter.mother?.fullKennelName ?? litter.mother?.givenName ?? 'Unbekannt'
										const stuntDogName = litter.stuntDog?.fullKennelName ?? litter.stuntDog?.givenName ?? '-'

										let distance: number | null = null
										if (userLocation) {
											const location = getLitterLocation(litter)
											if (location) {
												distance = calculateDistance(
													userLocation.lat,
													userLocation.lng,
													location.lat,
													location.lng
												)
											}
										}

										return (
											<TableRow
												key={litter.documentId}
												hover
												onClick={() => setSelectedLitter(litter)}
												sx={{ cursor: 'pointer' }}
											>
												<TableCell>
													{renderStatusBadge(litter.LitterStatus, true)}
												</TableCell>
												<TableCell>{orderLetter}</TableCell>
												<TableCell>
													<div className="font-medium text-gray-900">{kennelName}</div>
													<div className="text-xs text-gray-500">{breederMember}</div>
												</TableCell>
												<TableCell>
													{distance !== null ? `~${Math.round(distance)} km` : '-'}
												</TableCell>
												<TableCell>{motherName}</TableCell>
												<TableCell>{stuntDogName}</TableCell>
												<TableCell>{formatDate(litter.expectedDateOfBirth)}</TableCell>
												<TableCell>{formatDate(litter.dateOfBirth)}</TableCell>
												<TableCell align="center">
													<div className="flex justify-center gap-2 text-xs">
														<span className={litter.AmountRS?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountRS ? `${litter.AmountRS.Available ?? 0}/${litter.AmountRS.Total ?? 0}` : '-'}</span>
														<span className="text-gray-300">|</span>
														<span className={litter.AmountHS?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountHS ? `${litter.AmountHS.Available ?? 0}/${litter.AmountHS.Total ?? 0}` : '-'}</span>
													</div>
												</TableCell>
												<TableCell align="center">
													<div className="flex justify-center gap-2 text-xs">
														<span className={litter.AmountRSM?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountRSM ? `${litter.AmountRSM.Available ?? 0}/${litter.AmountRSM.Total ?? 0}` : '-'}</span>
														<span className="text-gray-300">|</span>
														<span className={litter.AmountHSM?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountHSM ? `${litter.AmountHSM.Available ?? 0}/${litter.AmountHSM.Total ?? 0}` : '-'}</span>
													</div>
												</TableCell>
												<TableCell align="center">
													<div className="flex justify-center gap-2 text-xs">
														<span className={litter.AmountRB?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountRB ? `${litter.AmountRB.Available ?? 0}/${litter.AmountRB.Total ?? 0}` : '-'}</span>
														<span className="text-gray-300">|</span>
														<span className={litter.AmountHB?.Available ?? 0 > 0 ? 'font-bold' : ''}>{litter.AmountHB ? `${litter.AmountHB.Available ?? 0}/${litter.AmountHB.Total ?? 0}` : '-'}</span>
													</div>
												</TableCell>
											</TableRow>
										)
									})}
								</TableBody>
							</Table>
						</TableContainer>
					)}

					{totalPages > 1 ? (
						<div className='mt-6 flex items-center justify-center gap-2'>
							<button
								type='button'
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1 || isLoading}
								className='rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
							>
								Zurück
							</button>
							<span className='text-sm text-gray-600'>
								Seite {currentPage} von {totalPages}
							</span>
							<button
								type='button'
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages || isLoading}
								className='rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
							>
								Weiter
							</button>
						</div>
					) : null}
				</>
			) : !isLoading ? (
				<div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600'>
					Keine Würfe gefunden. Bitte passen Sie Ihre Suchkriterien an.
				</div>
			) : null
			}
		</div >
	)
}


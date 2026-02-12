'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Pagination, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TableSortLabel, FormControlLabel } from '@mui/material'
import GridViewIcon from '@mui/icons-material/GridView'
import TableRowsIcon from '@mui/icons-material/TableRows'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { fetchGraphQL } from '@/lib/graphql-client'
import { SEARCH_BREEDERS } from '@/lib/graphql/queries'
import type { Breeder, BreederSearchResult, HzdSetting } from '@/types'
import { BreederCard } from './breeder-card'
import { BreederDetailsModal } from './breeder-details-modal'
import { BreederSearchForm } from './breeder-search-form'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { theme } from '@/themes'
import { MeinePlz } from '@/components/hzd-map/meine-plz'
import { calculateDistance } from '@/lib/geo-utils'
import { ViewToggle } from '@/components/common/view-toggle'

interface BreederSearchProps {
	strapiBaseUrl?: string | null
	hzdSetting?: HzdSetting | null
}

type PageSize = 5 | 10 | 20 | 50 | 100
type SortDirection = 'asc' | 'desc'
type SortField = 'kennelName' | 'member.lastName' | 'member.zip' | 'member.city' | 'member.phone' | 'member.email'

export function BreederSearch({ strapiBaseUrl, hzdSetting }: BreederSearchProps) {
	const [nameFilter, setNameFilter] = useState('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [breeders, setBreeders] = useState<Breeder[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalBreeders, setTotalBreeders] = useState(0)
	const [pageCount, setPageCount] = useState(0)
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
	const [selectedBreeder, setSelectedBreeder] = useState<Breeder | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [showMap, setShowMap] = useState(false)
	const [zipCode, setZipCode] = useState('')
	const [zipLocation, setZipLocation] = useState<{ lat: number; lng: number } | null>(null)

	// Sort state
	const [sortField, setSortField] = useState<SortField>('kennelName')
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

	const userLocation = zipLocation || null

	const searchBreeders = useCallback(async () => {
		if (!strapiBaseUrl) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const filterConditions: Array<Record<string, unknown>> = [
				{ IsActive: { eq: true } },
				{
					or: [
						{ Disable: { eq: false } },
						{ Disable: { null: true } },
					],
				},
			]

			if (nameFilter.trim()) {
				filterConditions.push({
					or: [
						{ kennelName: { containsi: nameFilter.trim() } },
						{ member: { lastName: { containsi: nameFilter.trim() } } },
						{ member: { firstName: { containsi: nameFilter.trim() } } },
						{ member: { DisplayName: { containsi: nameFilter.trim() } } },
						{ member: { username: { containsi: nameFilter.trim() } } },
					],
				})
			}

			const variables: Record<string, unknown> = {
				pagination: {
					page,
					pageSize,
				},
				sort: [`${sortField}:${sortDirection}`],
			}

			if (filterConditions.length > 0) {
				variables.filters = {
					and: filterConditions,
				}
			}

			const data = await fetchGraphQL<BreederSearchResult>(
				SEARCH_BREEDERS,
				{
					baseUrl: strapiBaseUrl,
					variables,
				},
			)

			const breedersArray = Array.isArray(data.hzdPluginBreeders_connection.nodes) ? data.hzdPluginBreeders_connection.nodes : []
			setBreeders(breedersArray)

			const pageInfo = data.hzdPluginBreeders_connection?.pageInfo
			if (pageInfo) {
				setTotalBreeders(pageInfo.total)
				setPageCount(pageInfo.pageCount)
			} else {
				setTotalBreeders(0)
				setPageCount(0)
			}
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Züchter konnten nicht geladen werden.')
			setError(fetchError)
			setBreeders([])
			setTotalBreeders(0)
			setPageCount(0)
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, nameFilter, page, pageSize, sortField, sortDirection])

	useEffect(() => {
		void searchBreeders()
	}, [searchBreeders])

	const handleSearch = useCallback(() => {
		setPage(1)
		void searchBreeders()
	}, [searchBreeders])

	const handlePageSizeChange = useCallback((newPageSize: PageSize) => {
		setPageSize(newPageSize)
		setPage(1)
	}, [])

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage)
	}, [])

	const handleBreederClick = useCallback((breeder: Breeder) => {
		setSelectedBreeder(breeder)
		setIsModalOpen(true)
	}, [])

	const handleCloseModal = useCallback(() => {
		setIsModalOpen(false)
		setSelectedBreeder(null)
	}, [])

	const handleSort = useCallback((field: SortField) => {
		if (sortField === field) {
			setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('asc')
		}
	}, [sortField])

	// Konvertiere Züchter in MapItems
	const mapItems = useMemo<MapItem[]>(() => {
		return breeders
			.map((breeder): MapItem | null => {
				const lat = breeder.member?.locationLat
				const lng = breeder.member?.locationLng

				if (typeof lat !== 'number' || typeof lng !== 'number') {
					return null
				}

				return {
					id: breeder.documentId,
					position: [lat, lng] as [number, number],
					title: breeder.kennelName || 'Unbekannt',
					popupContent: (
						<div>
							<strong>{breeder.kennelName}</strong>
							{breeder.member?.firstName && breeder.member?.lastName && (
								<div>{breeder.member.firstName} {breeder.member.lastName}</div>
							)}
						</div>
					),
				}
			})
			.filter((item): item is MapItem => item !== null)
	}, [breeders])

	const totalPages = pageCount
	const currentPage = page

	return (
		<div className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div className='w-full max-w-6xl'>
				{/* Karten-Toggle */}
				<Box className='mb-4 rounded-lg bg-white p-4 shadow-md' sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
						label='Karte anzeigen'
					/>
				</Box>

				{/* Karte */}
				<HzdMap isVisible={showMap} items={mapItems} userLocation={zipLocation} height={500} />

				{showMap && (
					<Box className='mb-4 w-full md:w-64'>
						<MeinePlz
							initialZip={zipCode}
							onZipChange={setZipCode}
							onLocationChange={setZipLocation}
						/>
					</Box>
				)}

				<BreederSearchForm
					nameFilter={nameFilter}
					onNameFilterChange={setNameFilter}
					onSearch={handleSearch}
					isLoading={isLoading}
				/>

				{error ? (
					<div className='mb-4 rounded bg-red-50 p-4 text-sm text-red-800'>
						{error.message}
					</div>
				) : null}

				<div className='mb-4 flex items-center justify-between'>
					<div className='text-sm text-gray-600'>
						{totalBreeders > 0 ? (
							<>
								Zeige {((currentPage - 1) * pageSize) + 1} bis{' '}
								{Math.min(currentPage * pageSize, totalBreeders)} von {totalBreeders} Züchtern
							</>
						) : (
							'Keine Züchter gefunden'
						)}
					</div>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
					</Box>
					{totalPages > 1 && (
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<Pagination
								count={totalPages}
								page={currentPage}
								onChange={(_, value) => handlePageChange(value)}
								disabled={isLoading}
								color='primary'
								size='small'
								showFirstButton
								showLastButton
								sx={{
									'& .MuiPaginationItem-root': { fontSize: '0.875rem' },
									'& .MuiPaginationItem-page.Mui-selected': {
										backgroundColor: theme.submitButtonColor,
										color: theme.submitButtonTextColor,
										'&:hover': {
											backgroundColor: theme.submitButtonColor,
											filter: 'brightness(90%)',
										},
									},
									'& .MuiPaginationItem-root.Mui-disabled': { opacity: 0.5 },
								}}
							/>
						</Box>
					)}
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
							className='rounded border border-gray-300 px-2 py-1 text-sm focus:border-yellow-400 focus:outline-none'
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
						Lade Züchter...
					</div>
				) : breeders.length > 0 ? (
					<>
						{viewMode === 'cards' ? (
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
								{breeders.map((breeder) => (
									<BreederCard
										key={breeder.documentId}
										breeder={breeder}
										strapiBaseUrl={strapiBaseUrl}
										onClick={() => handleBreederClick(breeder)}
										userLocation={userLocation}
										hzdSetting={hzdSetting}
									/>
								))}
							</div>
						) : (
							<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
								<Table size="small">
									<TableHead sx={{ backgroundColor: '#f9fafb' }}>
										<TableRow>
											<TableCell sx={{ fontWeight: 'bold' }}>
												<TableSortLabel
													active={sortField === 'kennelName'}
													direction={sortField === 'kennelName' ? sortDirection : 'asc'}
													onClick={() => handleSort('kennelName')}
												>
													Zwinger
												</TableSortLabel>
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												<TableSortLabel
													active={sortField === 'member.lastName'}
													direction={sortField === 'member.lastName' ? sortDirection : 'asc'}
													onClick={() => handleSort('member.lastName')}
												>
													Züchter
												</TableSortLabel>
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												<TableSortLabel
													active={sortField === 'member.zip'}
													direction={sortField === 'member.zip' ? sortDirection : 'asc'}
													onClick={() => handleSort('member.zip')}
												>
													PLZ
												</TableSortLabel>
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												<TableSortLabel
													active={sortField === 'member.city'}
													direction={sortField === 'member.city' ? sortDirection : 'asc'}
													onClick={() => handleSort('member.city')}
												>
													Ort
												</TableSortLabel>
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												<TableSortLabel
													active={sortField === 'member.phone'}
													direction={sortField === 'member.phone' ? sortDirection : 'asc'}
													onClick={() => handleSort('member.phone')}
												>
													Telefon
												</TableSortLabel>
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												<TableSortLabel
													active={sortField === 'member.email'}
													direction={sortField === 'member.email' ? sortDirection : 'asc'}
													onClick={() => handleSort('member.email')}
												>
													E-Mail
												</TableSortLabel>
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												Entfernung
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{breeders.map((breeder) => {
											const memberName = ((breeder.member?.firstName || '') + ' ' + (breeder.member?.lastName || '')).trim()
											let distance: number | null = null
											if (userLocation && typeof breeder.member?.locationLat === 'number' && typeof breeder.member?.locationLng === 'number') {
												distance = calculateDistance(
													userLocation.lat,
													userLocation.lng,
													breeder.member.locationLat,
													breeder.member.locationLng
												)
											}

											return (
												<TableRow
													key={breeder.documentId}
													hover
													onClick={() => handleBreederClick(breeder)}
													sx={{ cursor: 'pointer' }}
												>
													<TableCell>
														{breeder.WebsiteUrl ? (
															<a
																href={breeder.WebsiteUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='hover:underline inline-flex items-center gap-1 transition-colors'
																style={{ color: theme.submitButtonColor, textDecoration: 'none' }}
																onClick={(e) => e.stopPropagation()}
															>
																{breeder.kennelName || '-'}
																<OpenInNewIcon sx={{ fontSize: 16 }} />
															</a>
														) : (
															breeder.kennelName || '-'
														)}
													</TableCell>
													<TableCell>{memberName || '-'}</TableCell>
													<TableCell>{breeder.member?.zip || '-'}</TableCell>
													<TableCell>{breeder.member?.city || '-'}</TableCell>
													<TableCell>{breeder.member?.phone || '-'}</TableCell>
													<TableCell>{breeder.member?.email || '-'}</TableCell>
													<TableCell>{distance !== null ? `~${Math.round(distance)} km` : '-'}</TableCell>
												</TableRow>
											)
										})}
									</TableBody>
								</Table>
							</TableContainer>
						)}

					</>
				) : !isLoading ? (
					<div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600'>
						Keine Züchter gefunden. Bitte passen Sie Ihre Suchkriterien an.
					</div>
				) : null}
			</div>

			<BreederDetailsModal
				breeder={selectedBreeder}
				open={isModalOpen}
				onClose={handleCloseModal}
				strapiBaseUrl={strapiBaseUrl}
				hzdSetting={hzdSetting}
			/>
		</div>
	)
}


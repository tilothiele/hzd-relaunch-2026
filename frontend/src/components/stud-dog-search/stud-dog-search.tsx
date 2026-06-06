'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	Box,
	FormControlLabel,
	Pagination,
	Paper,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
} from '@mui/material'
import {
	getBreederApiSort,
	sortBreedersByField,
	type BreederSortField,
} from '@/lib/breeder-sort-utils'
import { searchBreeders } from '@/lib/strapi/api'
import type { Breeder, HzdSetting } from '@/types'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { MeinePlz } from '@/components/hzd-map/meine-plz'
import { ViewToggle } from '@/components/common/view-toggle'
import { calculateDistance } from '@/lib/geo-utils'
import { theme } from '@/themes'
import { StudDogCard } from './stud-dog-card'
import { StudDogDetailView } from './stud-dog-detail-view'
import { StudDogSearchForm } from './stud-dog-search-form'

interface StudDogSearchProps {
	strapiBaseUrl?: string | null
	hzdSetting?: HzdSetting | null
}

type PageSize = 5 | 10 | 20 | 50 | 100
type SortDirection = 'asc' | 'desc'
type SortField = BreederSortField

export function StudDogSearch({
	strapiBaseUrl,
	hzdSetting,
}: StudDogSearchProps) {
	const [nameFilter, setNameFilter] = useState('')
	const [nameInput, setNameInput] = useState('')
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState<PageSize>(10)
	const [breeders, setBreeders] = useState<Breeder[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [totalBreeders, setTotalBreeders] = useState(0)
	const [pageCount, setPageCount] = useState(0)
	const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
	const [selectedBreeder, setSelectedBreeder] = useState<Breeder | null>(null)
	const [showMap, setShowMap] = useState(false)
	const [zipCode, setZipCode] = useState('')
	const [zipLocation, setZipLocation] = useState<{
		lat: number
		lng: number
	} | null>(null)
	const [sortField, setSortField] = useState<SortField>('member.lastName')
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

	const userLocation = zipLocation || null

	const searchStudDogOwners = useCallback(async () => {
		if (!strapiBaseUrl) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const data = await searchBreeders(
				{
					name: nameFilter.trim() || undefined,
					breederRole: 'S',
					page,
					pageSize,
					sort: [getBreederApiSort(sortField, sortDirection)],
				},
				{},
			)
			const connection = data.hzdPluginBreeders_connection
			const breederNodes = sortBreedersByField(
				Array.isArray(connection.nodes) ? connection.nodes : [],
				sortField,
				sortDirection,
			)

			setBreeders(breederNodes)
			setTotalBreeders(connection.pageInfo?.total ?? 0)
			setPageCount(connection.pageInfo?.pageCount ?? 0)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Deckrüdenbesitzer konnten nicht geladen werden.')
			setError(fetchError)
			setBreeders([])
			setTotalBreeders(0)
			setPageCount(0)
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, nameFilter, page, pageSize, sortField, sortDirection])

	useEffect(() => {
		const timer = setTimeout(() => {
			setNameFilter(nameInput)
		}, 500)
		return () => clearTimeout(timer)
	}, [nameInput])

	useEffect(() => {
		void searchStudDogOwners()
	}, [searchStudDogOwners])

	const handleSearch = useCallback(() => {
		setNameFilter(nameInput)
		setPage(1)
		void searchStudDogOwners()
	}, [nameInput, searchStudDogOwners])

	const handlePageSizeChange = useCallback((newPageSize: PageSize) => {
		setPageSize(newPageSize)
		setPage(1)
	}, [])

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage)
	}, [])

	const handleBreederClick = useCallback((breeder: Breeder) => {
		setSelectedBreeder(breeder)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}, [])

	const handleBackToSearch = useCallback(() => {
		setSelectedBreeder(null)
	}, [])

	const handleSort = useCallback((field: SortField) => {
		if (sortField === field) {
			setSortDirection((prev) => prev === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('asc')
		}
	}, [sortField])

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
					title: [breeder.member?.firstName, breeder.member?.lastName]
						.filter(Boolean)
						.join(' ') || 'Unbekannt',
					popupContent: (
						<div>
							<strong>
								{[breeder.member?.firstName, breeder.member?.lastName]
									.filter(Boolean)
									.join(' ') || 'Unbekannt'}
							</strong>
							{breeder.member?.firstName && breeder.member?.lastName && (
								<div>
									Deckrüdenbesitzer
								</div>
							)}
						</div>
					),
				}
			})
			.filter((item): item is MapItem => item !== null)
	}, [breeders])

	if (selectedBreeder) {
		return (
			<StudDogDetailView
				breeder={selectedBreeder}
				strapiBaseUrl={strapiBaseUrl}
				hzdSetting={hzdSetting}
				onBack={handleBackToSearch}
			/>
		)
	}

	return (
		<div
			className='flex w-full justify-center px-4'
			style={{ paddingTop: '1em', paddingBottom: '1em' }}
		>
			<div className='w-full max-w-6xl'>
				<Box
					className='mb-4 rounded-lg bg-white p-4 shadow-md'
					sx={{ display: 'flex', justifyContent: 'flex-end' }}
				>
					<FormControlLabel
						control={
							<Switch
								checked={showMap}
								onChange={(event) => setShowMap(event.target.checked)}
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

				<HzdMap
					isVisible={showMap}
					items={mapItems}
					userLocation={zipLocation}
					height={500}
				/>

				{showMap && (
					<Box className='mb-4 w-full md:w-64'>
						<MeinePlz
							initialZip={zipCode}
							onZipChange={setZipCode}
							onLocationChange={setZipLocation}
						/>
					</Box>
				)}

				<StudDogSearchForm
					nameFilter={nameInput}
					onNameFilterChange={setNameInput}
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
								Zeige {((page - 1) * pageSize) + 1} bis{' '}
								{Math.min(page * pageSize, totalBreeders)} von{' '}
								{totalBreeders} Deckrüdenbesitzern
							</>
						) : (
							'Keine Deckrüdenbesitzer gefunden'
						)}
					</div>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<ViewToggle
							viewMode={viewMode}
							onViewModeChange={setViewMode}
						/>
					</Box>
					{pageCount > 1 && (
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<Pagination
								count={pageCount}
								page={page}
								onChange={(_, value) => handlePageChange(value)}
								disabled={isLoading}
								color='primary'
								size='small'
								showFirstButton
								showLastButton
							/>
						</Box>
					)}
					<div className='flex items-center gap-2'>
						<label
							htmlFor='stud-dog-page-size'
							className='text-sm text-gray-600'
						>
							Pro Seite:
						</label>
						<select
							id='stud-dog-page-size'
							value={pageSize}
							onChange={(event) =>
								handlePageSizeChange(Number(event.target.value) as PageSize)
							}
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
					<div className='py-8 text-center text-gray-600'>
						Lade Deckrüdenbesitzer...
					</div>
				) : breeders.length > 0 ? (
					viewMode === 'cards' ? (
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{breeders.map((breeder) => (
								<StudDogCard
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
						<TableContainer
							component={Paper}
							elevation={0}
							sx={{
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								overflow: 'hidden',
							}}
						>
							<Table size='small'>
								<TableHead sx={{ backgroundColor: '#f9fafb' }}>
									<TableRow>
										<TableCell sx={{ fontWeight: 'bold' }}>
											<TableSortLabel
												active={sortField === 'member.lastName'}
												direction={
													sortField === 'member.lastName'
														? sortDirection
														: 'asc'
												}
												onClick={() => handleSort('member.lastName')}
											>
												Deckrüdenbesitzer
											</TableSortLabel>
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											<TableSortLabel
												active={sortField === 'member.zip'}
												direction={
													sortField === 'member.zip'
														? sortDirection
														: 'asc'
												}
												onClick={() => handleSort('member.zip')}
											>
												PLZ
											</TableSortLabel>
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											<TableSortLabel
												active={sortField === 'member.city'}
												direction={
													sortField === 'member.city'
														? sortDirection
														: 'asc'
												}
												onClick={() => handleSort('member.city')}
											>
												Ort
											</TableSortLabel>
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											Telefon
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											E-Mail
										</TableCell>
										<TableCell sx={{ fontWeight: 'bold' }}>
											Entfernung
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{breeders.map((breeder) => {
										const memberName = [
											breeder.member?.firstName,
											breeder.member?.lastName,
										].filter(Boolean).join(' ')
										let distance: number | null = null

										if (
											userLocation &&
											typeof breeder.member?.locationLat === 'number' &&
											typeof breeder.member?.locationLng === 'number'
										) {
											distance = calculateDistance(
												userLocation.lat,
												userLocation.lng,
												breeder.member.locationLat,
												breeder.member.locationLng,
											)
										}

										return (
											<TableRow
												key={breeder.documentId}
												hover
												onClick={() => handleBreederClick(breeder)}
												sx={{ cursor: 'pointer' }}
											>
												<TableCell>{memberName || '-'}</TableCell>
												<TableCell>{breeder.member?.zip || '-'}</TableCell>
												<TableCell>{breeder.member?.city || '-'}</TableCell>
												<TableCell>{breeder.member?.phone || '-'}</TableCell>
												<TableCell>{breeder.member?.cEmail || '-'}</TableCell>
												<TableCell>
													{distance !== null
														? `~${Math.round(distance)} km`
														: '-'}
												</TableCell>
											</TableRow>
										)
									})}
								</TableBody>
							</Table>
						</TableContainer>
					)
				) : (
					<div className='rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600'>
						Keine Deckrüdenbesitzer gefunden. Bitte passen Sie Ihre
						Suchkriterien an.
					</div>
				)}
			</div>
		</div>
	)
}

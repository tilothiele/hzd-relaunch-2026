'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Box, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControlLabel } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useBreederListOrder } from '@/hooks/use-breeder-list-order'
import { searchBreeders as searchBreedersApi } from '@/lib/strapi/api'
import { enrichBreedersWithMembers } from '@/lib/breeder-member-enrich'
import type { Breeder, HzdSetting } from '@/types'
import { BreederCard } from './breeder-card'
import { BreederSearchForm, type BreederActiveFilter } from './breeder-search-form'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { theme } from '@/themes'
import { MeinePlz } from '@/components/hzd-map/meine-plz'
import { breederDetailPath, breederAddressFullName, resolveBreederObjectContact } from '@/lib/breeder-display-utils'
import { calculateDistance } from '@/lib/geo-utils'
import { SearchResultPager } from '@/components/common/search-result-pager'
import { PhoneLink } from '@/components/common/phone-link'
import { ViewToggle } from '@/components/common/view-toggle'

interface BreederSearchProps {
	strapiBaseUrl?: string | null
	hzdSetting?: HzdSetting | null
}

type PageSize = 5 | 10 | 20 | 50 | 100

export function BreederSearch({ strapiBaseUrl, hzdSetting }: BreederSearchProps) {
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
	const [showMap, setShowMap] = useState(false)
	const [zipCode, setZipCode] = useState('')
	const [zipLocation, setZipLocation] = useState<{ lat: number; lng: number } | null>(null)
	const [activeFilter, setActiveFilter] = useState<BreederActiveFilter>('active')
	const { order, seed, setOrder } = useBreederListOrder(nameFilter)
	const listQueryRef = useRef({ nameFilter, order, activeFilter })
	if (
		listQueryRef.current.nameFilter !== nameFilter
		|| listQueryRef.current.order !== order
		|| listQueryRef.current.activeFilter !== activeFilter
	) {
		listQueryRef.current = { nameFilter, order, activeFilter }
		if (page !== 1) {
			setPage(1)
		}
	}

	const userLocation = zipLocation || null

	const searchBreeders = useCallback(async () => {
		if (!strapiBaseUrl) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const data = await searchBreedersApi({
				name: nameFilter.trim() || undefined,
				breederRole: 'B',
				activeFilter,
				page,
				pageSize,
				order,
				seed,
			}, {})

			const breedersArray = await enrichBreedersWithMembers(
				Array.isArray(data.hzdPluginBreeders_connection.nodes)
					? data.hzdPluginBreeders_connection.nodes
					: [],
			)
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
	}, [strapiBaseUrl, nameFilter, activeFilter, page, pageSize, order, seed])

	useEffect(() => {
		const timer = setTimeout(() => {
			setNameFilter(nameInput)
		}, 500)
		return () => clearTimeout(timer)
	}, [nameInput])

	useEffect(() => {
		void searchBreeders()
	}, [searchBreeders])

	const handleSearch = useCallback(() => {
		setNameFilter(nameInput)
		setPage(1)
		void searchBreeders()
	}, [nameInput, searchBreeders])

	const handlePageSizeChange = useCallback((newPageSize: PageSize) => {
		setPageSize(newPageSize)
		setPage(1)
	}, [])

	const handlePageChange = useCallback((newPage: number) => {
		setPage(newPage)
	}, [])

	const router = useRouter()

	const openBreeder = useCallback((breeder: Breeder) => {
		router.push(breederDetailPath(breeder))
	}, [router])

	// Konvertiere Züchter in MapItems
	const mapItems = useMemo<MapItem[]>(() => {
		return breeders
			.map((breeder): MapItem | null => {
				// Name + Koordinaten ausschließlich aus dem Breeder-Objekt
				// (Address.FullName / Address.locationLat/Lng)
				const contact = resolveBreederObjectContact(breeder)
				if (
					typeof contact.locationLat !== 'number'
					|| typeof contact.locationLng !== 'number'
				) {
					return null
				}
				const addressFullName = breederAddressFullName(breeder)

				return {
					id: breeder.documentId,
					position: [contact.locationLat, contact.locationLng] as [number, number],
					title: breeder.kennelName || 'Unbekannt',
					popupContent: (
						<div>
							<strong>{breeder.kennelName}</strong>
							{addressFullName && (
								<div>{addressFullName}</div>
							)}
							<div>
								<Link href={breederDetailPath(breeder)}>Details anzeigen</Link>
							</div>
						</div>
					),
				}
			})
			.filter((item): item is MapItem => item !== null)
	}, [breeders])

	const resultPager = (idPrefix: string, className: string) => (
		<SearchResultPager
			idPrefix={idPrefix}
			className={className}
			page={page}
			pageCount={pageCount}
			pageSize={pageSize}
			disabled={isLoading}
			onPageChange={handlePageChange}
			onPageSizeChange={handlePageSizeChange}
		/>
	)

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
					nameFilter={nameInput}
					onNameFilterChange={setNameInput}
					activeFilter={activeFilter}
					onActiveFilterChange={setActiveFilter}
					order={order}
					onOrderChange={setOrder}
					onSearch={handleSearch}
					isLoading={isLoading}
				/>

				{error ? (
					<div className='mb-4 rounded bg-red-50 p-4 text-sm text-red-800'>
						{error.message}
					</div>
				) : null}

				<div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
					<div className='text-sm text-gray-600'>
						{totalBreeders > 0 ? (
							<>
								Zeige {((page - 1) * pageSize) + 1} bis{' '}
								{Math.min(page * pageSize, totalBreeders)} von {totalBreeders} Züchtern
							</>
						) : (
							'Keine Züchter gefunden'
						)}
					</div>
					<ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
				</div>

				{resultPager('breeder-results-top', 'mb-4')}

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
										onClick={() => openBreeder(breeder)}
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
												Zwinger
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												Züchter
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												PLZ
											</TableCell>
											<TableCell sx={{ fontWeight: 'bold' }}>
												Ort
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
											const contact = resolveBreederObjectContact(breeder)
											const breederPhone = contact.phone
											let distance: number | null = null
											if (
												userLocation
												&& typeof contact.locationLat === 'number'
												&& typeof contact.locationLng === 'number'
											) {
												distance = calculateDistance(
													userLocation.lat,
													userLocation.lng,
													contact.locationLat,
													contact.locationLng,
												)
											}

											return (
												<TableRow
													key={breeder.documentId}
													hover
													onClick={() => openBreeder(breeder)}
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
													<TableCell>{breederAddressFullName(breeder) || '-'}</TableCell>
													<TableCell>{contact.zip || '-'}</TableCell>
													<TableCell>{contact.city || '-'}</TableCell>
													<TableCell>
														{breederPhone ? (
															<PhoneLink
																phone={breederPhone}
																countryCode={contact.countryCode}
																style={{ color: theme.submitButtonColor }}
															/>
														) : '-'}
													</TableCell>
													<TableCell>{contact.email || '-'}</TableCell>
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

				{resultPager('breeder-results-bottom', 'mt-4')}
			</div>
		</div>
	)
}


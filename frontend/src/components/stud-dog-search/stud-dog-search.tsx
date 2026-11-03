'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
	Box,
	FormControlLabel,
	Paper,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material'
import { useBreederListOrder } from '@/hooks/use-breeder-list-order'
import { searchBreeders } from '@/lib/strapi/api'
import type { Breeder, HzdSetting } from '@/types'
import { HzdMap, type MapItem } from '@/components/hzd-map/hzd-map'
import { MeinePlz } from '@/components/hzd-map/meine-plz'
import { SearchResultPager } from '@/components/common/search-result-pager'
import { PhoneLink } from '@/components/common/phone-link'
import { ViewToggle } from '@/components/common/view-toggle'
import { breederDetailPath, resolveBreederContact, resolveBreederPhone } from '@/lib/breeder-display-utils'
import { calculateDistance } from '@/lib/geo-utils'
import { theme } from '@/themes'
import { StudDogCard } from './stud-dog-card'
import { StudDogSearchForm } from './stud-dog-search-form'

interface StudDogSearchProps {
	strapiBaseUrl?: string | null
	hzdSetting?: HzdSetting | null
}

type PageSize = 5 | 10 | 20 | 50 | 100

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
	const [showMap, setShowMap] = useState(false)
	const [zipCode, setZipCode] = useState('')
	const [zipLocation, setZipLocation] = useState<{
		lat: number
		lng: number
	} | null>(null)
	const { order, seed, setOrder } = useBreederListOrder(nameFilter)
	const listQueryRef = useRef({ nameFilter, order })
	if (
		listQueryRef.current.nameFilter !== nameFilter
		|| listQueryRef.current.order !== order
	) {
		listQueryRef.current = { nameFilter, order }
		if (page !== 1) {
			setPage(1)
		}
	}

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
					order,
					seed,
				},
				{},
			)
			const connection = data.hzdPluginBreeders_connection
			const breederNodes = Array.isArray(connection.nodes)
				? connection.nodes
				: []

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
	}, [strapiBaseUrl, nameFilter, page, pageSize, order, seed])

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

	const router = useRouter()

	const openBreeder = useCallback((breeder: Breeder) => {
		router.push(breederDetailPath(breeder))
	}, [router])

	const mapItems = useMemo<MapItem[]>(() => {
		return breeders
			.map((breeder): MapItem | null => {
				const contact = resolveBreederContact(breeder)
				if (
					typeof contact.locationLat !== 'number'
					|| typeof contact.locationLng !== 'number'
				) {
					return null
				}

				const title = contact.ownerDisplayName || 'Unbekannt'

				return {
					id: breeder.documentId,
					position: [contact.locationLat, contact.locationLng] as [number, number],
					title,
					popupContent: (
						<div>
							<strong>{title}</strong>
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
								{Math.min(page * pageSize, totalBreeders)} von{' '}
								{totalBreeders} Deckrüdenbesitzern
							</>
						) : (
							'Keine Deckrüdenbesitzer gefunden'
						)}
					</div>
					<ViewToggle
						viewMode={viewMode}
						onViewModeChange={setViewMode}
					/>
				</div>

				{resultPager('stud-dog-results-top', 'mb-4')}

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
									onClick={() => openBreeder(breeder)}
									userLocation={userLocation}
									hzdSetting={hzdSetting}
									breederRole="S"
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
											Deckrüdenbesitzer
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
										const contact = resolveBreederContact(breeder)
										const breederPhone = resolveBreederPhone(breeder)
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
												<TableCell>{contact.ownerDisplayName || '-'}</TableCell>
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

				{resultPager('stud-dog-results-bottom', 'mt-4')}
			</div>
		</div>
	)
}

'use client'

import { useDogs } from '@/hooks/use-dogs'
import { Box, CircularProgress, Pagination, Typography, Modal, IconButton, Chip } from '@mui/material'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { resolveDogImage } from '@/lib/dog-utils'
import { formatDate } from '@/lib/date-utils'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CloseIcon from '@mui/icons-material/Close'
import { theme } from '@/themes'
import type { Dog, HzdSetting } from '@/types'

interface BreederDogsListProps {
	ownerCIds: number[]
	strapiBaseUrl?: string | null
	hzdSetting?: HzdSetting | null
	/** Züchter: keine Zuchthunde öffentlich listen */
	hasNoDogsAvailabe?: boolean | null
	onDogSelect: (dog: Dog) => void
}

export function BreederDogsList({
	ownerCIds,
	strapiBaseUrl,
	hzdSetting,
	hasNoDogsAvailabe,
	onDogSelect,
}: BreederDogsListProps) {
	const [page, setPage] = useState(1)
	const [zoomImage, setZoomImage] = useState<{ url: string; name: string } | null>(null)
	const pageSize = 5

	const breederHidesDogListing = hasNoDogsAvailabe === true
	const resolvedOwnerCIds = ownerCIds.filter((cId) => typeof cId === 'number')
	const canQueryDogs = resolvedOwnerCIds.length > 0

	const { dogs, totalDogs, pageCount, isLoading } = useDogs(
		useMemo(() => ({
			filters: {
				ownerCIds: resolvedOwnerCIds,
				sexFilter: 'F',
				sort: ['givenName:asc'],
			},
			pagination: {
				page,
				pageSize,
			},
						queryDisabled: breederHidesDogListing || !canQueryDogs,
		}), [resolvedOwnerCIds.join(','), page, pageSize, strapiBaseUrl, breederHidesDogListing, canQueryDogs])
	)

	const handlePageChange = (_: unknown, value: number) => {
		setPage(value)
	}

	const handleZoomClose = () => setZoomImage(null)

	if (breederHidesDogListing) {
		return (
			<Box sx={{ mt: 1 }}>
				<Chip
					label='Aktuell keine Hunde in der Zucht'
					color='warning'
					variant='outlined'
				/>
			</Box>
		)
	}

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress size={30} />
			</Box>
		)
	}

	return (
		<Box sx={{ mt: 1 }}>
			<Typography variant='h6' gutterBottom sx={{ borderBottom: '1px solid #e5e7eb', pb: 1, mb: 3 }}>
				Zuchthündinnen ({totalDogs})
			</Typography>

			{!isLoading && dogs.length === 0 ? (
				<Typography variant='body2' color='text.secondary'>
					Keine zuchtfähigen Hündinnen hinterlegt.
				</Typography>
			) : (
				<div className='flex flex-col gap-1'>
					{dogs.map((dog) => {
						const avatarUrl = resolveDogImage(dog, hzdSetting, strapiBaseUrl)

						return (
							<div
								key={dog.documentId}
								className='flex flex-row items-center justify-between gap-1 border-b border-gray-100 pb-1 last:border-0'
							>
								<div className='flex-1 min-w-0'>
									<h4 className='text-sm font-bold text-gray-900 truncate mb-1'>
										<button
											type='button'
											className='hover:underline flex items-center gap-1 group text-left'
											onClick={() => {
												onDogSelect(dog)
												window.scrollTo({ top: 0, behavior: 'smooth' })
											}}
										>
											{dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'}
											<OpenInNewIcon
												sx={{ fontSize: 14 }}
												className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"
											/>
										</button>
									</h4>
									<div className='text-xs text-gray-600 space-y-0.5'>
										{dog.dateOfBirth && (
											<p>
												<span className='font-medium'>Geb.:</span> {formatDate(dog.dateOfBirth)}
											</p>
										)}
										{dog.cStudBookNumber && (
											<p>
												<span className='font-medium'>Zuchtbuch-Nr.:</span> {dog.cStudBookNumber}
											</p>
										)}
									</div>
								</div>

								<div
									className='relative w-48 h-36 shrink-0 overflow-hidden rounded bg-gray-100 cursor-zoom-in group/img'
									onClick={() => setZoomImage({ url: avatarUrl, name: dog.fullKennelName ?? dog.givenName ?? 'Hund' })}
								>
									<Image
										src={avatarUrl}
										alt={dog.givenName ?? 'Hund'}
										fill
										className='object-cover transition-transform duration-300 group-hover/img:scale-110'
										unoptimized
										sizes='192px'
									/>
									<div className='absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center'>
										<div className='opacity-0 group-hover/img:opacity-100 transition-opacity bg-white/80 p-1.5 rounded-full shadow-md'>
											<OpenInNewIcon sx={{ fontSize: 18, color: 'action.active' }} />
										</div>
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}

			{pageCount > 1 && (
				<Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
					<Pagination
						count={pageCount}
						page={page}
						onChange={handlePageChange}
						color='primary'
						size='small'
					/>
				</Box>
			)}

			<Modal
				open={!!zoomImage}
				onClose={handleZoomClose}
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					p: 2,
					backdropFilter: 'blur(4px)',
					bgcolor: 'rgba(0, 0, 0, 0.7)'
				}}
			>
				<Box sx={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh', outline: 'none' }}>
					<IconButton
						onClick={handleZoomClose}
						sx={{
							position: 'absolute',
							top: -16,
							right: -16,
							bgcolor: theme.footerBackground,
							color: theme.headerFooterTextColor,
							'&:hover': {
								bgcolor: theme.footerBackground,
								filter: 'brightness(90%)'
							},
							boxShadow: 2,
							zIndex: 1
						}}
						size='small'
					>
						<CloseIcon fontSize='small' />
					</IconButton>
					{zoomImage && (
						<Box sx={{
							position: 'relative',
							width: '90vw',
							maxWidth: '1000px',
							aspectRatio: '4/3',
							borderRadius: 2,
							overflow: 'hidden',
							bgcolor: 'black',
							display: 'flex',
							flexDirection: 'column'
						}}>
							<Box sx={{ position: 'relative', flexGrow: 1 }}>
								<Image
									src={zoomImage.url}
									alt={zoomImage.name}
									fill
									className='object-contain'
									unoptimized
									sizes='(max-width: 1000px) 90vw, 1000px'
								/>
							</Box>
							<Box sx={{ bgcolor: theme.footerBackground, p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'rgba(255,255,255,0.1)' }}>
								<Typography variant="h6" sx={{ fontWeight: 600, color: theme.headerFooterTextColor }}>
									{zoomImage.name}
								</Typography>
							</Box>
						</Box>
					)}
				</Box>
			</Modal>
		</Box>
	)
}

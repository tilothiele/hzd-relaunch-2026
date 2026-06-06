'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
	Box,
	CircularProgress,
	IconButton,
	Modal,
	Pagination,
	Typography,
} from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CloseIcon from '@mui/icons-material/Close'
import { useDogs } from '@/hooks/use-dogs'
import { resolveDogImage } from '@/lib/dog-utils'
import { formatDate } from '@/lib/date-utils'
import { theme } from '@/themes'
import type { Dog, HzdSetting } from '@/types'

interface StudDogsListProps {
	ownerCIds: number[]
	strapiBaseUrl?: string | null
	hzdSetting?: HzdSetting | null
	onDogSelect: (dog: Dog) => void
}

export function StudDogsList({
	ownerCIds,
	strapiBaseUrl,
	hzdSetting,
	onDogSelect,
}: StudDogsListProps) {
	const [page, setPage] = useState(1)
	const [zoomImage, setZoomImage] = useState<{
		url: string
		name: string
	} | null>(null)
	const pageSize = 5
	const resolvedOwnerCIds = ownerCIds.filter((cId) => typeof cId === 'number')
	const { dogs, totalDogs, pageCount, isLoading } = useDogs(
		useMemo(() => ({
			filters: {
				ownerCIds: resolvedOwnerCIds,
				sexFilter: 'M' as const,
				sort: ['givenName:asc'],
			},
			pagination: {
				page,
				pageSize,
			},
						queryDisabled: resolvedOwnerCIds.length === 0,
		}), [resolvedOwnerCIds.join(','), page, pageSize, strapiBaseUrl])
	)

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress size={30} />
			</Box>
		)
	}

	if (dogs.length === 0) {
		return null
	}

	return (
		<Box sx={{ mt: 4 }}>
			<Typography
				variant='h6'
				gutterBottom
				sx={{ borderBottom: '1px solid #e5e7eb', pb: 1, mb: 3 }}
			>
				Deckrüden ({totalDogs})
			</Typography>

			<div className='flex flex-col gap-1'>
				{dogs.map((dog) => {
					const avatarUrl = resolveDogImage(dog, hzdSetting, strapiBaseUrl)
					const dogName = dog.fullKennelName ?? dog.givenName ?? 'Deckrüde'

					return (
						<div
							key={dog.documentId}
							className='flex flex-row items-center justify-between gap-1 border-b border-gray-100 pb-1 last:border-0'
						>
							<div className='min-w-0 flex-1'>
								<h4 className='mb-1 truncate text-sm font-bold text-gray-900'>
									<button
										type='button'
										className='group flex items-center gap-1 text-left hover:underline'
										onClick={() => {
											onDogSelect(dog)
											window.scrollTo({ top: 0, behavior: 'smooth' })
										}}
									>
										{dogName}
										<OpenInNewIcon
											sx={{ fontSize: 14 }}
											className='text-gray-400 opacity-0 transition-opacity group-hover:opacity-100'
										/>
									</button>
								</h4>
								<div className='space-y-0.5 text-xs text-gray-600'>
									{dog.dateOfBirth ? (
										<p>
											<span className='font-medium'>Geb.:</span>{' '}
											{formatDate(dog.dateOfBirth)}
										</p>
									) : null}
									{dog.cStudBookNumber ? (
										<p>
											<span className='font-medium'>Zuchtbuch-Nr.:</span>{' '}
											{dog.cStudBookNumber}
										</p>
									) : null}
								</div>
							</div>

							<div
								className='group/img relative h-36 w-48 shrink-0 cursor-zoom-in overflow-hidden rounded bg-gray-100'
								onClick={() => setZoomImage({ url: avatarUrl, name: dogName })}
							>
								<Image
									src={avatarUrl}
									alt={dogName}
									fill
									className='object-cover transition-transform duration-300 group-hover/img:scale-110'
									unoptimized
									sizes='192px'
								/>
								<div className='absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/img:bg-black/10'>
									<div className='rounded-full bg-white/80 p-1.5 opacity-0 shadow-md transition-opacity group-hover/img:opacity-100'>
										<OpenInNewIcon sx={{ fontSize: 18, color: 'action.active' }} />
									</div>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{pageCount > 1 ? (
				<Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
					<Pagination
						count={pageCount}
						page={page}
						onChange={(_, value) => setPage(value)}
						color='primary'
						size='small'
					/>
				</Box>
			) : null}

			<Modal
				open={!!zoomImage}
				onClose={() => setZoomImage(null)}
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					p: 2,
					backdropFilter: 'blur(4px)',
					bgcolor: 'rgba(0, 0, 0, 0.7)',
				}}
			>
				<Box sx={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh', outline: 'none' }}>
					<IconButton
						onClick={() => setZoomImage(null)}
						sx={{
							position: 'absolute',
							top: -16,
							right: -16,
							bgcolor: theme.footerBackground,
							color: theme.headerFooterTextColor,
							'&:hover': {
								bgcolor: theme.footerBackground,
								filter: 'brightness(90%)',
							},
							boxShadow: 2,
							zIndex: 1,
						}}
						size='small'
					>
						<CloseIcon fontSize='small' />
					</IconButton>
					{zoomImage ? (
						<Box
							sx={{
								position: 'relative',
								width: '90vw',
								maxWidth: '1000px',
								aspectRatio: '4/3',
								borderRadius: 2,
								overflow: 'hidden',
								bgcolor: 'black',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
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
							<Box
								sx={{
									bgcolor: theme.footerBackground,
									p: 2,
									textAlign: 'center',
									borderTop: '1px solid',
									borderColor: 'rgba(255,255,255,0.1)',
								}}
							>
								<Typography
									variant='h6'
									sx={{ fontWeight: 600, color: theme.headerFooterTextColor }}
								>
									{zoomImage.name}
								</Typography>
							</Box>
						</Box>
					) : null}
				</Box>
			</Modal>
		</Box>
	)
}

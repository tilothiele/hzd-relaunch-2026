'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { resolveGalleryPhotographerName } from '@/components/image-gallery/gallery-photographer'

interface MonthGroup {
	monthKey: string
	monthLabel: string
	photographers: {
		photographerName: string
		images: GalleryImage[]
	}[]
}

interface ImageGalleryViewProps {
	heroImage: GalleryImage
	featuredImages: GalleryImage[]
	monthGroups: MonthGroup[]
	strapiUrl: string
}

export function ImageGalleryView({
	heroImage,
	featuredImages,
	monthGroups,
	strapiUrl,
}: ImageGalleryViewProps) {
	const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

	const allImages = useMemo(() => {
		const seen = new Set<string>()
		const result: GalleryImage[] = []

		const push = (img: GalleryImage) => {
			if (seen.has(img.documentId)) return
			seen.add(img.documentId)
			result.push(img)
		}

		featuredImages.forEach(push)
		monthGroups.forEach((month) => {
			month.photographers.forEach((group) => {
				group.images.forEach(push)
			})
		})

		if (!seen.has(heroImage.documentId)) {
			result.unshift(heroImage)
		}

		return result
	}, [featuredImages, monthGroups, heroImage])

	const selectedIndex = selectedImage
		? allImages.findIndex((img) => img.documentId === selectedImage.documentId)
		: -1

	const showPreviousImage = useCallback(() => {
		if (allImages.length === 0 || selectedIndex < 0) return
		const previousIndex = (selectedIndex - 1 + allImages.length) % allImages.length
		setSelectedImage(allImages[previousIndex])
	}, [allImages, selectedIndex])

	const showNextImage = useCallback(() => {
		if (allImages.length === 0 || selectedIndex < 0) return
		const nextIndex = (selectedIndex + 1) % allImages.length
		setSelectedImage(allImages[nextIndex])
	}, [allImages, selectedIndex])

	useEffect(() => {
		if (!selectedImage) return

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setSelectedImage(null)
				return
			}
			if (e.key === 'ArrowLeft') {
				e.preventDefault()
				showPreviousImage()
				return
			}
			if (e.key === 'ArrowRight') {
				e.preventDefault()
				showNextImage()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [selectedImage, showPreviousImage, showNextImage])

	useEffect(() => {
		if (selectedImage) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}
	}, [selectedImage])

	const heroImageUrl = heroImage.GalleryImageMedia
		? resolveMediaUrl(heroImage.GalleryImageMedia, strapiUrl)
		: null

	const canNavigate = allImages.length > 1

	return (
		<>
			<section className='w-full bg-white'>
				<div
					className='relative h-[65vh] min-h-[450px] w-full cursor-pointer overflow-hidden bg-gray-900'
					onClick={() => setSelectedImage(heroImage)}
				>
					{heroImageUrl && (
						<Image
							src={heroImageUrl as string}
							alt={heroImage.GalleryImageMedia?.alternativeText || 'Hero Image'}
							fill
							className='object-cover transition-transform duration-700 hover:scale-105'
							priority
							unoptimized
						/>
					)}
					<div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-8 md:p-12'>
						<div className='mx-auto max-w-6xl'>
							<h1 className='text-3xl font-semibold tracking-tight text-white/90 md:text-5xl'>
								Bildergalerie
							</h1>
						</div>
					</div>
				</div>
			</section>

			{featuredImages.length > 0 && (
				<SectionContainer backgroundColor='#f8fafc'>
					<div className='py-12'>
						<div className='mb-8 flex items-center gap-3'>
							<div className='h-8 w-1.5 rounded-full bg-primary/70'></div>
							<h2 className='text-2xl font-semibold text-gray-700'>Highlights</h2>
						</div>

						<div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
							{featuredImages.map((img) => (
								<div
									key={img.documentId}
									className='group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md'
									onClick={() => setSelectedImage(img)}
								>
									<div className='relative aspect-[16/10] w-full overflow-hidden'>
										{img.GalleryImageMedia && (
											<Image
												src={resolveMediaUrl(img.GalleryImageMedia, strapiUrl) as string}
												alt={img.GalleryImageMedia.alternativeText || 'Featured Image'}
												fill
												className='object-cover transition-transform duration-500 group-hover:scale-105'
												unoptimized
											/>
										)}
									</div>
									<div className='space-y-1 px-4 py-3'>
										<p className='text-xs text-gray-400'>
											{new Date(img.DateOfPicture).toLocaleDateString('de-DE')}
											{' · '}
											{resolveGalleryPhotographerName(img)}
										</p>
										{img.ImageDescription && (
											<p className='line-clamp-2 text-sm text-gray-500'>
												{img.ImageDescription}
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</SectionContainer>
			)}

			<SectionContainer>
				<div className='py-14'>
					<div className='mb-10'>
						<h2 className='mb-1 text-2xl font-semibold text-gray-700'>Archiv</h2>
						<p className='text-sm text-gray-400'>
							Einsendungen sortiert nach Monaten.
						</p>
					</div>

					{monthGroups.map((month) => (
						<div key={month.monthKey} className='mb-16 last:mb-0'>
							<h3 className='mb-6 text-lg font-medium text-gray-600'>
								{month.monthLabel}
							</h3>

							{month.photographers.map((group, pIdx) => (
								<div
									key={`${month.monthKey}-${group.photographerName}-${pIdx}`}
									className='mb-10 last:mb-0'
								>
									<h4 className='mb-4 text-sm font-medium text-gray-400'>
										{group.photographerName}
									</h4>

									<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
										{group.images.map((img) => (
											<div
												key={img.documentId}
												className='group flex cursor-pointer flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md'
												onClick={() => setSelectedImage(img)}
											>
												<div className='relative aspect-[4/3] w-full overflow-hidden'>
													{img.GalleryImageMedia && (
														<Image
															src={resolveMediaUrl(img.GalleryImageMedia, strapiUrl) as string}
															alt={img.GalleryImageMedia.alternativeText || 'Gallery Image'}
															fill
															className='object-cover transition-transform duration-500 group-hover:scale-105'
															unoptimized
														/>
													)}
												</div>
												{img.ImageDescription && (
													<div className='px-3 py-2'>
														<p className='line-clamp-1 text-xs leading-relaxed text-gray-500'>
															{img.ImageDescription}
														</p>
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					))}
				</div>
			</SectionContainer>

			{selectedImage && (
				<div
					className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/98 transition-opacity duration-300'
					onClick={() => setSelectedImage(null)}
				>
					<button
						className='absolute right-4 top-4 z-[10000] rounded-full bg-white/10 p-3 text-white transition-all hover:scale-110 hover:bg-white/20 md:right-8 md:top-8'
						aria-label='Schließen'
						onClick={(e) => {
							e.stopPropagation()
							setSelectedImage(null)
						}}
					>
						<CloseIcon sx={{ fontSize: 32 }} />
					</button>

					{canNavigate && (
						<>
							<button
								className='absolute left-2 top-1/2 z-[10000] -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition-all hover:scale-110 hover:bg-white/30 md:left-6 md:p-3'
								aria-label='Vorheriges Bild'
								onClick={(e) => {
									e.stopPropagation()
									showPreviousImage()
								}}
							>
								<ChevronLeftIcon sx={{ fontSize: { xs: 36, md: 48 } }} />
							</button>
							<button
								className='absolute right-2 top-1/2 z-[10000] -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition-all hover:scale-110 hover:bg-white/30 md:right-6 md:p-3'
								aria-label='Nächstes Bild'
								onClick={(e) => {
									e.stopPropagation()
									showNextImage()
								}}
							>
								<ChevronRightIcon sx={{ fontSize: { xs: 36, md: 48 } }} />
							</button>
						</>
					)}

					<div className='relative flex h-full w-full max-w-[95vw] items-center justify-center p-4'>
						<div
							className='relative flex w-full flex-col items-center'
							onClick={(e) => e.stopPropagation()}
						>
							<div className='relative h-[80vh] w-full max-w-6xl overflow-hidden rounded-lg'>
								{selectedImage.GalleryImageMedia && (
									<Image
										src={resolveMediaUrl(selectedImage.GalleryImageMedia, strapiUrl) as string}
										alt={selectedImage.GalleryImageMedia.alternativeText || 'Lightbox Image'}
										fill
										className='object-contain'
										unoptimized
									/>
								)}
							</div>
							<div className='mt-5 max-w-3xl px-4 text-center'>
								{canNavigate && selectedIndex >= 0 && (
									<p className='mb-2 text-xs text-white/50'>
										{selectedIndex + 1} / {allImages.length}
									</p>
								)}
								<p className='text-base font-medium tracking-wide text-white'>
									{new Date(selectedImage.DateOfPicture).toLocaleDateString('de-DE')}
									{' · '}
									{resolveGalleryPhotographerName(selectedImage)}
								</p>
								{selectedImage.ImageDescription && (
									<p className='mt-2 text-base leading-relaxed text-gray-100'>
										{selectedImage.ImageDescription}
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

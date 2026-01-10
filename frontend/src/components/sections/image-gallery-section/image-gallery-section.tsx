'use client'

import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import Image from 'next/image'
import type { ImageGallerySection, Image as ImageType } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { SectionContainer } from '@/components/sections/section-container/section-container'

interface ImageGallerySectionComponentProps {
	section: ImageGallerySection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

export function ImageGallerySectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: ImageGallerySectionComponentProps) {
	const images = section.GalleryImages?.filter(
		(image): image is ImageType => Boolean(image),
	) ?? []

	if (images.length === 0) {
		return null
	}

	const backgroundColor = theme.evenBgColor

	return (
		<SectionContainer
			variant='full-width'
			id={section.ImageGalleryAnchor || undefined}
			backgroundColor={backgroundColor}
			paddingTop='2em'
			paddingBottom='2em'
		>
			<div className='w-full max-w-6xl mx-auto'>
				{section.GalleryHeadline ? (
					<h2
						className='mb-10 mt-8 text-center text-4xl font-bold'
						style={{ color: theme.headlineColor }}
					>
						{section.GalleryHeadline}
					</h2>
				) : null}

				<div suppressHydrationWarning>
					<ResponsiveMasonry
						columnsCountBreakPoints={{ 350: 1, 640: 2, 1024: 3 }}
					>
						<Masonry gutter='20px'>
							{images.map((image, index) => {
								const url = resolveMediaUrl(image, strapiBaseUrl)
								if (!url) return null

								return (
									<div
										key={image.url || index}
										className='group overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl'
									>
										<Image
											src={url}
											alt={image.alternativeText ?? 'Gallerie Bild'}
											width={image.width ?? 800}
											height={image.height ?? 600}
											className='h-auto w-full transition-transform duration-500 group-hover:scale-110'
											unoptimized
											sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
										/>
										{image.caption && (
											<div className='absolute inset-x-0 bottom-0 translate-y-full bg-black/60 p-4 text-white transition-transform duration-300 group-hover:translate-y-0'>
												<p className='text-sm'>{image.caption}</p>
											</div>
										)}
									</div>
								)
							})}
						</Masonry>
					</ResponsiveMasonry>
				</div>
			</div>
		</SectionContainer>
	)
}




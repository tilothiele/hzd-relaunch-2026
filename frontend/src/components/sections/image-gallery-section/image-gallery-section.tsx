'use client'

import PhotoAlbum from 'react-photo-album'
import type { ImageGallerySection, Image } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import type { Photo } from 'react-photo-album'

interface ImageGallerySectionComponentProps {
	section: ImageGallerySection
	strapiBaseUrl: string
}

function convertToPhotoAlbumImages(
	images: Image[],
	strapiBaseUrl: string,
): Photo[] {
	return images
		.filter((image): image is Image => Boolean(image))
		.map((image) => {
			const url = resolveMediaUrl(image, strapiBaseUrl)
			const width = image.width ?? 400
			const height = image.height ?? 300

			return {
				src: url ?? '',
				width,
				height,
				alt: image.alternativeText ?? '',
			}
		})
}

export function ImageGallerySectionComponent({
	section,
	strapiBaseUrl,
}: ImageGallerySectionComponentProps) {
	const images = section.GalleryImages?.filter(
		(image): image is Image => Boolean(image),
	) ?? []

	if (images.length === 0) {
		return null
	}

	const photos = convertToPhotoAlbumImages(images, strapiBaseUrl)

	return (
		<section className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div className='w-full max-w-6xl'>
				{section.GalleryHeadline ? (
					<h2 className='mb-8 text-3xl font-semibold text-gray-900'>
						{section.GalleryHeadline}
					</h2>
				) : null}

				<PhotoAlbum
					photos={photos}
					layout='masonry'
					columns={(containerWidth) => {
						if (containerWidth < 640) return 1
						if (containerWidth < 1024) return 2
						return 3
					}}
					spacing={8}
					padding={0}
				/>
			</div>
		</section>
	)
}




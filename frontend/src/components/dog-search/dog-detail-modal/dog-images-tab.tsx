'use client'

import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import Image from 'next/image'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import type { Dog } from '@/types'

interface DogImagesTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

export function DogImagesTab({ dog, strapiBaseUrl }: DogImagesTabProps) {
	const images = dog.Images?.filter(Boolean) ?? []

	if (images.length === 0) {
		return (
			<div className='rounded-lg bg-gray-50 p-8 text-center text-gray-500'>
				<p>Keine weiteren Bilder verfügbar.</p>
			</div>
		)
	}

	return (
		<div className='w-full'>
			<div suppressHydrationWarning>
				<ResponsiveMasonry
					columnsCountBreakPoints={{ 350: 1, 640: 2, 1024: 3 }}
				>
					<Masonry gutter='20px'>
						{images.map((image, index) => {
							// Use resolveMediaUrl, but handle null strapiBaseUrl by creating a fallback or asserting string
							// Since resolveMediaUrl expects string, we pass empty string if null, which might need adjustment
							const url = resolveMediaUrl(image, strapiBaseUrl ?? '')
							if (!url) return null

							return (
								<div
									key={image.url || index}
									className='group overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl'
								>
									<Image
										src={url}
										alt={image.alternativeText ?? `Bild von ${dog.givenName}`}
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
	)
}





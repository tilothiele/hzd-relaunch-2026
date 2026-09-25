import Image from 'next/image'
import type { GalleryImage } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface GalleryFittedImageProps {
	image: GalleryImage
	strapiUrl: string
	alt: string
	priority?: boolean
	motionClassName?: string
}

export function GalleryFittedImage({
	image,
	strapiUrl,
	alt,
	priority = false,
	motionClassName = '',
}: GalleryFittedImageProps) {
	const src = resolveMediaUrl(image.GalleryImageMedia, strapiUrl)
	if (!src) return null

	const motion = motionClassName.trim()

	if (image.fit !== 'fill') {
		return (
			<Image
				src={src}
				alt={alt}
				fill
				priority={priority}
				className={['object-cover', motion].filter(Boolean).join(' ')}
				unoptimized
			/>
		)
	}

	return (
		<div className='absolute inset-0 overflow-hidden'>
			<img
				src={src}
				alt=''
				aria-hidden
				className='pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover'
				style={{
					width: '180%',
					height: '180%',
					filter: 'blur(40px) saturate(1.25)',
				}}
			/>
			<Image
				src={src}
				alt={alt}
				fill
				priority={priority}
				className={[
					'z-10 object-contain object-center',
					motion,
				].filter(Boolean).join(' ')}
				unoptimized
			/>
		</div>
	)
}

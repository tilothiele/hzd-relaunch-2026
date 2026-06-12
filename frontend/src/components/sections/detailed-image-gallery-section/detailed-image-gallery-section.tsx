'use client'

import { useEffect, useState } from 'react'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import Image from 'next/image'
import type {
	DetailedImageGallerySection,
	DetailedImageItem,
	Image as ImageType,
} from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface DetailedImageGallerySectionComponentProps {
	section: DetailedImageGallerySection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

function resolveDetailedImageItems(
	items: DetailedImageItem[] | null | undefined,
): Array<DetailedImageItem & { image: ImageType }> {
	if (!items?.length) {
		return []
	}

	return items.flatMap((item) => {
		if (!item?.DetailedImage) {
			return []
		}

		return [{ ...item, image: item.DetailedImage }]
	})
}

function renderDetailedImageItem(
	item: DetailedImageItem & { image: ImageType },
	index: number,
	section: DetailedImageGallerySection,
	strapiBaseUrl: string,
	theme: ThemeDefinition,
) {
	const url = resolveMediaUrl(item.image, strapiBaseUrl)
	if (!url) return null

	const itemKey = item.id
		|| item.image.url
		|| `${section.DetailedImagesAnchor ?? 'detailed-gallery'}-${index}`

	return (
		<article
			key={itemKey}
			className='overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl'
		>
			{item.DetailedImageHeadline ? (
				<h3
					className='px-4 pb-3 pt-4 text-lg font-semibold'
					style={{ color: theme.headlineColor }}
				>
					{item.DetailedImageHeadline}
				</h3>
			) : null}

			<div className='group relative overflow-hidden'>
				<Image
					src={url}
					alt={
						item.image.alternativeText
						?? item.DetailedImageHeadline
						?? 'Galerie Bild'
					}
					width={item.image.width ?? 800}
					height={item.image.height ?? 600}
					className='h-auto w-full transition-transform duration-500 group-hover:scale-105'
					unoptimized
					sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
				/>
			</div>

			{item.DetailedImageDescription ? (
				<div
					className='prose prose-sm max-w-none px-4 pb-4 pt-3'
					style={{ color: theme.textColor }}
					dangerouslySetInnerHTML={{
						__html: item.DetailedImageDescription,
					}}
				/>
			) : null}
		</article>
	)
}

export function DetailedImageGallerySectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: DetailedImageGallerySectionComponentProps) {
	const [isMasonryMounted, setIsMasonryMounted] = useState(false)
	const { elementRef, isVisible } = useScrollAnimation({
		threshold: 0.1,
		triggerOnce: false,
	})

	useEffect(() => {
		setIsMasonryMounted(true)
	}, [])

	const items = resolveDetailedImageItems(section.DetailedImage)

	if (items.length === 0) {
		return null
	}

	const backgroundColor = theme.evenBgColor

	return (
		<SectionContainer
			variant='full-width'
			id={section.DetailedImagesAnchor || undefined}
			backgroundColor={backgroundColor}
			paddingTop='2em'
			paddingBottom='2em'
		>
			<div
				ref={elementRef}
				className='mx-auto w-full max-w-6xl'
				style={{
					opacity: isVisible ? 1 : 0,
					transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
					transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
				}}
			>
				{section.DetailedImagesHeadline ? (
					<h2
						className='mb-10 mt-8 text-center text-4xl font-bold'
						style={{ color: theme.headlineColor }}
					>
						{section.DetailedImagesHeadline}
					</h2>
				) : null}

				{isMasonryMounted ? (
					<ResponsiveMasonry
						columnsCountBreakPoints={{ 350: 1, 640: 2, 1024: 3 }}
					>
						<Masonry gutter='20px'>
							{items.map((item, index) => renderDetailedImageItem(
								item,
								index,
								section,
								strapiBaseUrl,
								theme,
							))}
						</Masonry>
					</ResponsiveMasonry>
				) : (
					<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
						{items.map((item, index) => renderDetailedImageItem(
							item,
							index,
							section,
							strapiBaseUrl,
							theme,
						))}
					</div>
				)}
			</div>
		</SectionContainer>
	)
}

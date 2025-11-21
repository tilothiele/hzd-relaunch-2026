'use client'

import Image from 'next/image'
import type { TeaserTextWithImageSection } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'

interface TeaserTextWithImageSectionComponentProps {
	section: TeaserTextWithImageSection
	strapiBaseUrl: string
}

export function TeaserTextWithImageSectionComponent({
	section,
	strapiBaseUrl,
}: TeaserTextWithImageSectionComponentProps) {
	const imageUrl = resolveMediaUrl(section.Image, strapiBaseUrl)
	const imageAlt = section.Image?.alternativeText ?? 'Teaser Bild'
	const imagePosition = section.ImagePosition ?? 'left'
	const headline = section.TeaserHeadline
	const teaserText = section.TeaserText
	const actionButton = section.ActionButton

	if (!headline && !teaserText && !imageUrl) {
		return null
	}

	const isImageLeft = imagePosition === 'left'

	return (
		<section className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div className='w-full max-w-6xl'>
				<div className={`grid gap-8 md:grid-cols-2 ${isImageLeft ? '' : 'md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1'}`}>
					{imageUrl ? (
						<div className='flex items-center justify-center'>
							<div className='relative w-full' style={{ minHeight: '300px' }}>
								<Image
									src={imageUrl}
									alt={imageAlt}
									width={600}
									height={400}
									className='h-full w-full rounded-lg object-cover'
									unoptimized
								/>
							</div>
						</div>
					) : null}

					<div className='flex flex-col justify-center gap-4'>
						{headline ? (
							<h2 className='text-3xl font-semibold text-gray-900'>
								{headline}
							</h2>
						) : null}

						{teaserText ? (
							<div
								className='prose prose-lg max-w-none text-gray-700'
								dangerouslySetInnerHTML={{ __html: teaserText }}
							/>
						) : null}

						{actionButton ? (
							<div className='mt-4'>
								<ActionButton actionButton={actionButton} />
							</div>
						) : null}
					</div>
				</div>
			</div>
		</section>
	)
}



import Image from 'next/image'
import type { TeaserTextWithImageSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '../section-container/section-container'

interface TeaserTextWithImageSectionComponentProps {
	section: TeaserTextWithImageSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

export function TeaserTextWithImageSectionComponent({
	section,
	strapiBaseUrl,
	theme,
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
	const backgroundColor = section.TeaserOddEven === 'Odd' ? theme.oddBgColor : theme.evenBgColor

	return (
		<SectionContainer
			variant='max-width'
			backgroundColor={backgroundColor}
			paddingTop='1em'
			paddingBottom='1em'
		>
				<div className={`grid gap-8 md:grid-cols-2 ${isImageLeft ? '' : 'md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1'}`}>
					{imageUrl ? (
						<div className='flex items-center justify-center'>
							<div className='relative' style={{ minHeight: '300px' }}>
								<Image
									src={imageUrl}
									alt={imageAlt}
									width={300}
									height={400}
									className='object-cover'
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
		</SectionContainer>
	)
}



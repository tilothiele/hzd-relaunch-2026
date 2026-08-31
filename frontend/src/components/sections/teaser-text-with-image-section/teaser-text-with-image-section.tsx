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

	const mapPadding = (size: 'small' | 'middle' | 'large' | null | undefined) => {
		switch (size) {
			case 'small': return '1rem'
			case 'middle': return '2rem'
			case 'large': return '3rem'
			default: return '1em'
		}
	}

	const paddingTop = mapPadding(section.TTWI_Padding?.Top)
	const paddingBottom = mapPadding(section.TTWI_Padding?.Bottom)

	return (
		<SectionContainer
			variant='max-width'
			id={section.TeaserAnchor || undefined}
			backgroundColor={backgroundColor}
			paddingTop={paddingTop}
			paddingBottom={paddingBottom}
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
						<h2
							className='text-3xl'
							style={{ color: theme.headlineColor }}
						>
							{headline}
						</h2>
					) : null}

					{teaserText ? (
						<div
							className='prose max-w-none dark:prose-invert [&_p]:my-2'
							style={{
								color: theme.textColor,
								'--tw-prose-body': theme.textColor,
								'--tw-prose-headings': theme.headlineColor,
							} as React.CSSProperties}
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



'use client'

import type { SimpleCtaSection } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface SimpleCtaSectionComponentProps {
	section: SimpleCtaSection
	strapiBaseUrl: string
}

export function SimpleCtaSectionComponent({
	section,
	strapiBaseUrl,
}: SimpleCtaSectionComponentProps) {
	const backgroundImageUrl = resolveMediaUrl(section.CtaBackgroundImage, strapiBaseUrl)
	const headline = section.CtaHeadline
	const text = section.CtaInfoText
	const actionButton = section.CtaActionButton

	if (!headline && !text && !actionButton) {
		return null
	}

	return (
		<section
			className='relative min-h-[500px] w-full'
			style={{
				backgroundImage: backgroundImageUrl ? `url('${backgroundImageUrl}')` : undefined,
				backgroundAttachment: 'fixed',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
				backgroundSize: 'cover',
			}}
		>
			<div className='flex min-h-[500px] w-full items-center justify-center px-4 py-16'>
				<div className='w-full max-w-4xl rounded-lg bg-white/90 px-8 py-12 shadow-lg'>
					{headline ? (
						<h2 className='mb-6 text-3xl font-bold' style={{ color: '#A8267D' }}>
							{headline}
						</h2>
					) : null}

					{text ? (
						<div
							className='mb-8 text-justify text-gray-700 prose prose-lg max-w-none'
							dangerouslySetInnerHTML={{ __html: text }}
						/>
					) : null}

					{actionButton?.Link ? (
						<div className='flex justify-center'>
							<a
								href={actionButton.Link}
								className='inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-semibold uppercase transition-opacity hover:opacity-90'
								style={{
									backgroundColor: '#FAD857',
									color: '#565757',
								}}
							>
								{actionButton.Label ?? 'Mehr erfahren'}
							</a>
						</div>
					) : null}
				</div>
			</div>
		</section>
	)
}


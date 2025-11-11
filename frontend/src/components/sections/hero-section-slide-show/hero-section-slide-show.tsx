'use client'

import { useMemo } from 'react'
import AwesomeSlider from 'react-awesome-slider'
import withAutoplay from 'react-awesome-slider/dist/autoplay'
import 'react-awesome-slider/dist/styles.css'
const AutoplaySlider = withAutoplay(AwesomeSlider)

import type { HeroSectionSlideShow } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface HeroSectionSlideShowProps {
	section: HeroSectionSlideShow
	strapiBaseUrl: string
	autoPlayIntervalMs?: number
}

export function HeroSectionSlideShowComponent({
	section,
	strapiBaseUrl,
	autoPlayIntervalMs = 6000,
}: HeroSectionSlideShowProps) {
	const slides = useMemo(
		() => section.Headline?.filter(Boolean) ?? [],
		[section.Headline],
	)

	if (slides.length === 0) {
		return null
	}

	return (
		<section className='relative mb-16 overflow-hidden rounded-3xl'>
			<AutoplaySlider
				play={slides.length > 1}
				cancelOnInteraction={false}
				interval={autoPlayIntervalMs}
				bullets={slides.length > 1}
				className='hero-section-slider'
			>
				{slides.map((slide, index) => {
					const imageUrl = resolveMediaUrl(slide?.HeroImage, strapiBaseUrl)

					return (
						<div key={slide?.id ?? index}>
							<article
								className='relative flex min-h-[28rem] items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-16 text-white sm:px-12 md:px-20'
								style={
									imageUrl
										? { backgroundImage: `url('${imageUrl}')` }
										: undefined
								}
							>
								<div className='absolute inset-0 bg-black/40' />
								<div className='relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 text-center'>
									{slide?.Headline ? (
										<h2 className='text-3xl font-bold sm:text-4xl md:text-5xl'>
											{slide.Headline}
										</h2>
									) : null}
									{slide?.Subheadline ? (
										<p className='text-base sm:text-lg md:text-xl'>
											{slide.Subheadline}
										</p>
									) : null}
									{slide?.ActionButton?.Link ? (
										<div className='flex justify-center'>
											<a
												href={slide.ActionButton.Link}
												className='rounded-full bg-yellow-400 px-6 py-2 text-sm font-semibold text-gray-900 transition-opacity hover:opacity-90'
											>
												{slide.ActionButton.Label ?? 'Mehr erfahren'}
											</a>
										</div>
									) : null}
								</div>
							</article>
						</div>
					)
				})}
			</AutoplaySlider>
		</section>
	)
}


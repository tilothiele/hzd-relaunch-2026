'use client'

import { useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, A11y, Keyboard } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

import type { HeroSectionSlideShow } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'

interface HeroSectionSlideShowProps {
	section: HeroSectionSlideShow
	strapiBaseUrl: string
	theme: ThemeDefinition
	autoPlayIntervalMs?: number
}

export function HeroSectionSlideShowComponent({
	section,
	strapiBaseUrl,
	theme,
	autoPlayIntervalMs = 6000,
}: HeroSectionSlideShowProps) {
	const backgroundColor = theme.evenBgColor
	const slides = useMemo(
		() => section.Headline?.filter(Boolean) ?? [],
		[section.Headline],
	)

	if (slides.length === 0) {
		return null
	}

	return (
		<section className='relative overflow-hidden' style={{ backgroundColor }}>
			<Swiper
				modules={[Autoplay, Pagination, A11y, Keyboard]}
				slidesPerView={1}
				loop={slides.length > 1}
				autoplay={
					slides.length > 1
						? {
							delay: autoPlayIntervalMs,
							disableOnInteraction: false,
						}
						: false
				}
				pagination={slides.length > 1 ? { clickable: true } : false}
				keyboard={{ enabled: true }}
				className='hero-section-slider !h-full !w-full'
			>
				{slides.map((slide, index) => {
					const imageUrl = resolveMediaUrl(slide?.HeroImage, strapiBaseUrl)

					return (
						<SwiperSlide key={slide?.id ?? index}>
							<div className='relative flex min-h-[32rem] items-center justify-center text-white sm:min-h-[40rem] md:min-h-[48rem]'>
								{imageUrl ? (
									<span
										className='absolute inset-0 block bg-black'
										style={{ opacity: 0.4 }}
									/>
								) : null}
								<div
									className='absolute inset-0 bg-no-repeat'
									style={
										imageUrl
											? {
												backgroundImage: `url('${imageUrl}')`,
												backgroundSize: '100% auto',
												backgroundPosition: 'center 20%',
												backgroundColor: '#000',
											}
											: undefined
									}
								/>
								<div className='hero-section-slide-content relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-24 text-center sm:px-12 md:px-24'>
									{slide?.Headline ? (
										<h2
											className='hero-section-slide-headline'
										>
											{slide.Headline}
										</h2>
									) : null}
									{slide?.Subheadline ? (
										<h4
											className='hero-section-slide-subheadline'
										>
											{slide.Subheadline}
										</h4>
									) : null}
									{slide?.ActionButton ? (
										<div className='flex justify-center'>
											<ActionButton actionButton={slide.ActionButton} theme={theme} />
										</div>
									) : null}
								</div>
							</div>
						</SwiperSlide>
					)
				})}
			</Swiper>
		</section>
	)
}


'use client'

import { useMemo } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, A11y, Keyboard } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

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
		<section className='relative mb-16 overflow-hidden'>
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
										<h2 className='hero-section-slide-headline font-heading font-bold tracking-tight'>
											{slide.Headline}
										</h2>
									) : null}
									{slide?.Subheadline ? (
										<p className='hero-section-slide-subheadline font-medium'>
											{slide.Subheadline}
										</p>
									) : null}
									{slide?.ActionButton?.Link ? (
										<div className='flex justify-center'>
											<a
												href={slide.ActionButton.Link}
												className='bg-[#3d5b4f] px-16 py-4 text-base font-semibold uppercase tracking-[0.25em] text-white transition-transform duration-200 hover:scale-[1.03] hover:bg-[#2f4a3f]'
											>
												{slide.ActionButton.Label ?? 'Mehr erfahren'}
											</a>
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


'use client'

import { useMemo, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, A11y, Keyboard } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import { Typography } from '@mui/material'

import type { HeroSectionSlideShow } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '@/components/sections/section-container/section-container'

interface HeroSectionSlideShowProps {
	section: HeroSectionSlideShow
	strapiBaseUrl: string
	theme: ThemeDefinition
	autoPlayIntervalMs?: number
}

function useImageLoaded(imageUrl: string | null): boolean {
	const [isLoaded, setIsLoaded] = useState(false)

	useEffect(() => {
		if (!imageUrl) {
			setIsLoaded(false)
			return
		}

		// Prüfe ob Bild bereits im Cache ist
		const img = new Image()
		img.onload = () => {
			// Kurze Verzögerung, damit das Bild vollständig gerendert ist
			setTimeout(() => {
				setIsLoaded(true)
			}, 150)
		}
		img.onerror = () => {
			setIsLoaded(false)
		}
		img.src = imageUrl

		return () => {
			setIsLoaded(false)
		}
	}, [imageUrl])

	return isLoaded
}

interface HeroSlideContentProps {
	slide: NonNullable<HeroSectionSlideShow['Headline']>[0]
	imageUrl: string | null
	theme: ThemeDefinition
}

function HeroSlideContent({ slide, imageUrl, theme }: HeroSlideContentProps) {
	const isLoaded = useImageLoaded(imageUrl)

	return (
		<>
			{imageUrl ? (
				<span
					className='absolute inset-0 block bg-black z-10'
					style={{ opacity: 0.4 }}
				/>
			) : null}
			<div className='absolute inset-0 overflow-hidden'>
				<div
					className={`absolute inset-0 bg-no-repeat ${imageUrl && isLoaded ? 'hero-section-image-zoom' : ''}`}
					style={
						imageUrl
							? {
									backgroundImage: `url('${imageUrl}')`,
									backgroundSize: 'cover',
									backgroundPosition: 'center 20%',
									backgroundColor: '#000',
									width: '100%',
									height: '100%',
								}
							: undefined
					}
				/>
			</div>
			<div className='hero-section-slide-content relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-24 text-center sm:px-12 md:px-24'>
				{slide?.Headline ? (
					<Typography
						variant='h2'
						className='hero-section-slide-headline'
						sx={{
							fontWeight: 600,
							letterSpacing: '-0.025em',
							textAlign: 'center',
							width: '100%',
						}}
					>
						{slide.Headline}
					</Typography>
				) : null}
				{slide?.Subheadline ? (
					<Typography
						variant='h4'
						className='hero-section-slide-subheadline'
						sx={{
							fontWeight: 500,
							textAlign: 'center',
							width: '100%',
						}}
					>
						{slide.Subheadline}
					</Typography>
				) : null}
				{slide?.ActionButton ? (
					<div className='flex justify-center'>
						<ActionButton actionButton={slide.ActionButton} theme={theme} />
					</div>
				) : null}
			</div>
		</>
	)
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
		<SectionContainer
			variant='full-width'
			backgroundColor={backgroundColor}
		>
			<div className='relative overflow-hidden'>
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
								<HeroSlideContent
									slide={slide}
									imageUrl={imageUrl}
									theme={theme}
								/>
							</div>
						</SwiperSlide>
					)
				})}
				</Swiper>
			</div>
		</SectionContainer>
	)
}


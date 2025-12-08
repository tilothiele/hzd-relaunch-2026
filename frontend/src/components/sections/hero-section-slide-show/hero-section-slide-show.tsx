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

interface HeroSlideProps {
	slide: NonNullable<HeroSectionSlideShow['Headline']>[0]
	imageUrl: string | null
	theme: ThemeDefinition
	index: number
}

function HeroSlide({ slide, imageUrl, theme, index }: HeroSlideProps) {
	const [imageLoaded, setImageLoaded] = useState(false)
	const [shouldAnimate, setShouldAnimate] = useState(false)

	useEffect(() => {
		if (imageUrl) {
			const img = new Image()
			img.onload = () => {
				setImageLoaded(true)
				// Kurze Verzögerung, damit das Bild vollständig gerendert ist
				setTimeout(() => {
					setShouldAnimate(true)
				}, 100)
			}
			img.onerror = () => {
				setImageLoaded(false)
			}
			img.src = imageUrl
		} else {
			setImageLoaded(false)
		}
	}, [imageUrl])

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
					className={`absolute inset-0 bg-no-repeat ${imageUrl && shouldAnimate ? 'hero-section-image-zoom' : ''}`}
					style={
						imageUrl
							? {
									backgroundImage: `url('${imageUrl}')`,
									backgroundSize: 'cover',
									backgroundPosition: 'center 20%',
									backgroundColor: '#000',
									// Stelle sicher, dass das Bild immer die volle Größe hat
									width: '100%',
									height: '100%',
								}
							: undefined
					}
				/>
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
			</div>
		</SwiperSlide>
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
						<HeroSlide
							key={slide?.id ?? index}
							slide={slide}
							imageUrl={imageUrl}
							theme={theme}
							index={index}
						/>
					)
				})}
				</Swiper>
			</div>
		</SectionContainer>
	)
}


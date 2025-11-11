'use client'

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type CSSProperties,
	type MouseEvent,
} from 'react'
import type { HeroSectionSlideShow, SlideItem } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface HeroSectionSlideShowProps {
	section: HeroSectionSlideShow
	strapiBaseUrl: string
	autoPlayIntervalMs?: number
}

function getSlideMediaStyles(
	slide: SlideItem | null | undefined,
	baseUrl: string,
): CSSProperties {
	const imageUrl = resolveMediaUrl(slide?.HeroImage, baseUrl)

	if (!imageUrl) {
		return {}
	}

	return {
		backgroundImage: `url('${imageUrl}')`,
	}
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
	const [activeIndex, setActiveIndex] = useState(0)
	const slideCount = slides.length

	useEffect(() => {
		if (slideCount <= 1) {
			return
		}

		const intervalId = window.setInterval(() => {
			setActiveIndex((previousIndex) => {
				const nextIndex = previousIndex + 1
				return nextIndex >= slideCount ? 0 : nextIndex
			})
		}, autoPlayIntervalMs)

		return () => window.clearInterval(intervalId)
	}, [autoPlayIntervalMs, slideCount])

	const handleSelect = useCallback((index: number) => {
		setActiveIndex(index)
	}, [])

	const handleNext = useCallback(() => {
		if (slideCount === 0) {
			return
		}

		setActiveIndex((previousIndex) => {
			const nextIndex = previousIndex + 1
			return nextIndex >= slideCount ? 0 : nextIndex
		})
	}, [slideCount])

	const handlePrevious = useCallback(() => {
		if (slideCount === 0) {
			return
		}

		setActiveIndex((previousIndex) => {
			const nextIndex = previousIndex - 1
			return nextIndex < 0 ? slideCount - 1 : nextIndex
		})
	}, [slideCount])

	const handleDotClick = useCallback(
		(event: MouseEvent<HTMLButtonElement>) => {
			const { index } = event.currentTarget.dataset
			if (typeof index === 'undefined') {
				return
			}

			const parsedIndex = Number.parseInt(index, 10)
			if (Number.isNaN(parsedIndex)) {
				return
			}

			handleSelect(parsedIndex)
		},
		[handleSelect],
	)

	if (slideCount === 0) {
		return null
	}

	return (
		<section className='relative mb-16 overflow-hidden rounded-3xl'>
			<div
				className='flex transition-transform duration-700 ease-in-out'
				style={{
					transform: `translateX(-${activeIndex * 100}%)`,
					width: `${slideCount * 100}%`,
				}}
			>
				{slides.map((slide, index) => (
					<article
						key={slide?.id ?? index}
						className='relative flex w-full min-h-[28rem] items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-16 text-white sm:px-12 md:px-20'
						style={getSlideMediaStyles(slide, strapiBaseUrl)}
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
				))}
			</div>

			<button
				type='button'
				onClick={handlePrevious}
				className='absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 sm:flex'
				aria-label='Vorheriger Slide'
			>
				‹
			</button>
			<button
				type='button'
				onClick={handleNext}
				className='absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 sm:flex'
				aria-label='Nächster Slide'
			>
				›
			</button>

		<div className='absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2'>
				{slides.map((slide, index) => {
					const isActive = index === activeIndex

					return (
						<button
							key={slide?.id ?? index}
							type='button'
							data-index={index}
							onClick={handleDotClick}
							className={`h-2 w-8 rounded-full transition-all ${
								isActive ? 'bg-yellow-400' : 'bg-white/40'
							}`}
							aria-label={`Slide ${index + 1} auswählen`}
							aria-pressed={isActive}
						/>
					)
				})}
			</div>
		</section>
	)
}


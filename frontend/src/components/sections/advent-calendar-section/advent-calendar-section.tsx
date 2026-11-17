'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer'
import type { AdventCalendarSection, AdventDay, Image as MediaImage } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import {
	isAdventAnnouncementVisible,
	isAdventSectionHidden,
	isDoorOpenable,
	resolveAdventMoment,
} from '@/lib/advent-calendar'

interface AdventCalendarSectionComponentProps {
	section: AdventCalendarSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

interface DoorFace {
	background: string
	color: string
	pattern: 'plain' | 'dots' | 'stripes' | 'ribbon'
	snow: boolean
}

const FALLBACK_BACKGROUND = '#0c241c'

function adventBackgroundColor(value: string | null | undefined): string {
	const color = value?.trim() ?? ''
	if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
		return color
	}
	return FALLBACK_BACKGROUND
}

const VISUAL_ORDER = [
	9, 18, 10, 11, 3,
	2, 19, 4, 24, 8,
	7, 20, 14,
	13, 17, 6, 16, 21,
	22, 15, 1, 12, 5, 23,
]

const FACES: DoorFace[] = [
	{ background: '#1f6b45', color: '#f0e2b6', pattern: 'plain', snow: true },
	{ background: '#1c3358', color: '#f0e2b6', pattern: 'plain', snow: true },
	{ background: '#7a2430', color: '#f6ead0', pattern: 'plain', snow: true },
	{ background: '#f4ecdc', color: '#7a2430', pattern: 'dots', snow: false },
	{ background: '#1f6b45', color: '#f0e2b6', pattern: 'plain', snow: true },
	{ background: '#8d3a32', color: '#f6ead0', pattern: 'stripes', snow: false },
	{ background: '#234e3a', color: '#f0e2b6', pattern: 'plain', snow: false },
	{ background: '#243e66', color: '#f0e2b6', pattern: 'plain', snow: false },
	{ background: '#f4ecdc', color: '#7a2430', pattern: 'dots', snow: true },
	{ background: '#7a2430', color: '#f6ead0', pattern: 'ribbon', snow: false },
	{ background: '#1a5c3a', color: '#e8d7a8', pattern: 'ribbon', snow: false },
	{ background: '#8d3a32', color: '#f6ead0', pattern: 'plain', snow: true },
	{ background: '#f7f1e6', color: '#7a2430', pattern: 'plain', snow: false },
	{ background: '#1f6b45', color: '#f0e2b6', pattern: 'plain', snow: false },
	{ background: '#7a2430', color: '#f6ead0', pattern: 'plain', snow: true },
	{ background: '#8d3a32', color: '#f6ead0', pattern: 'stripes', snow: false },
	{ background: '#1c3358', color: '#f0e2b6', pattern: 'plain', snow: true },
	{ background: '#f4ecdc', color: '#6b2a24', pattern: 'plain', snow: false },
	{ background: '#1a5c3a', color: '#e8d7a8', pattern: 'ribbon', snow: true },
	{ background: '#8d3a32', color: '#f6ead0', pattern: 'plain', snow: false },
	{ background: '#1f6b45', color: '#f0e2b6', pattern: 'plain', snow: false },
	{ background: '#7a2430', color: '#f6ead0', pattern: 'plain', snow: true },
	{ background: '#f4ecdc', color: '#7a2430', pattern: 'plain', snow: false },
	{ background: '#8d3a32', color: '#f6ead0', pattern: 'stripes', snow: true },
]

function faceFor(day: number): DoorFace {
	if (day === 24) {
		return {
			background: '#1a5c3a',
			color: '#e8d7a8',
			pattern: 'ribbon',
			snow: false,
		}
	}

	return FACES[(day - 1) % FACES.length]
}

function resolveThumbnailUrl(
	media: MediaImage | null | undefined,
	baseUrl: string,
): string | null {
	if (!media) {
		return null
	}

	const formats = media.formats as {
		thumbnail?: { url?: string }
		small?: { url?: string }
	} | null
	const thumbPath = formats?.thumbnail?.url || formats?.small?.url
	if (thumbPath) {
		return resolveMediaUrl({ url: thumbPath }, baseUrl)
	}

	return resolveMediaUrl(media, baseUrl)
}

function AdventAnnouncement ({
	content,
	image,
	imageUrl,
}: {
	content?: BlocksContent | null
	image?: MediaImage | null
	imageUrl?: string | null
}) {
	const hasText = Array.isArray(content) && content.length > 0
	if (!hasText && !imageUrl) {
		return null
	}

	const text = hasText ? (
		<div className='whitespace-pre-line text-center text-lg leading-relaxed text-[#f4e7c5] sm:text-left [&_a]:text-[#f4e7c5] [&_a]:underline [&_li]:text-[#f4e7c5] [&_p]:text-[#f4e7c5] [&_p+p]:mt-4'>
			<BlocksRenderer content={content} />
		</div>
	) : null

	if (!imageUrl) {
		return <div className='relative mt-6'>{text}</div>
	}

	return (
		<div className='relative mt-6 grid items-center gap-12 sm:grid-cols-2'>
			<Image
				src={imageUrl}
				alt={image?.alternativeText || 'Adventskalender'}
				width={image?.width ?? 800}
				height={image?.height ?? 800}
				className='h-auto w-full rounded-xl object-contain'
				unoptimized
			/>
			{text}
		</div>
	)
}

function doorHoverLabel(day: number, year: number): string {
	const dayLabel = String(day).padStart(2, '0')
	return `Dein Adventskalendertürchen für den ${dayLabel}.12.${year}`
}

function ClosedPadlock ({
	large,
	color,
}: {
	large: boolean
	color: string
}) {
	const maskId = useId().replace(/:/g, '')

	return (
		<svg
			viewBox='0 0 64 76'
			className={large ? 'h-12 w-10' : 'h-9 w-8'}
			aria-hidden
			style={{ color }}
		>
			<mask id={maskId}>
				<rect width='64' height='76' fill='black' />
				<path
					d='M18 32V20a14 14 0 0 1 28 0v12'
					fill='none'
					stroke='white'
					strokeWidth='7'
					strokeLinecap='round'
				/>
				<rect x='6' y='30' width='52' height='40' rx='7' fill='white' />
				<circle cx='32' cy='44' r='6' fill='black' />
				<path d='M28.4 48h7.2l2.2 12h-11.6z' fill='black' />
			</mask>
			<rect
				width='64'
				height='76'
				fill='currentColor'
				mask={`url(#${maskId})`}
			/>
		</svg>
	)
}

function spanClass(day: number): string {
	if (day === 24) {
		return 'col-span-2 row-span-2'
	}
	if (day === 10 || day === 7) {
		return 'col-span-2'
	}
	if (day === 20 || day === 14) {
		return 'row-span-2'
	}
	return ''
}

function Snowfall() {
	const flakes = useMemo(() => (
		Array.from({ length: 32 }, (_, index) => ({
			id: index,
			left: `${(index * 31) % 100}%`,
			delay: `${(index % 8) * 0.8}s`,
			duration: `${9 + (index % 7)}s`,
			size: index % 5 === 0 ? 7 : 3 + (index % 3),
			opacity: 0.45 + (index % 4) * 0.12,
		}))
	), [])

	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden>
			{flakes.map((flake) => (
				<span
					key={flake.id}
					className='advent-snowflake'
					style={{
						left: flake.left,
						width: flake.size,
						height: flake.size,
						opacity: flake.opacity,
						animationDelay: flake.delay,
						animationDuration: flake.duration,
					}}
				/>
			))}
		</div>
	)
}

function DoorPattern({ face }: { face: DoorFace }) {
	if (face.pattern === 'dots') {
		return (
			<span
				className='pointer-events-none absolute inset-0'
				style={{
					backgroundImage: 'radial-gradient(rgba(122,36,48,0.28) 1.1px, transparent 1.2px)',
					backgroundSize: '11px 11px',
				}}
			/>
		)
	}

	if (face.pattern === 'stripes') {
		return (
			<span
				className='pointer-events-none absolute inset-0 opacity-80'
				style={{
					backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 9px, rgba(255,255,255,0.14) 9px, rgba(255,255,255,0.14) 10px)',
				}}
			/>
		)
	}

	if (face.pattern === 'ribbon') {
		return (
			<span className='pointer-events-none absolute -right-8 top-5 h-5 w-28 rotate-45 bg-[#d4b46a]' />
		)
	}

	return null
}

export function AdventCalendarSectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: AdventCalendarSectionComponentProps) {
	const moment = resolveAdventMoment(section.TestDate)
	const titleId = useId()
	const dialogTitleId = useId()
	const [selectedDay, setSelectedDay] = useState<number | null>(null)
	const [openingDay, setOpeningDay] = useState<number | null>(null)
	const [showDoors, setShowDoors] = useState(false)
	const openTimer = useRef<number | null>(null)

	const daysByNumber = useMemo(() => {
		const map = new Map<number, AdventDay>()
		for (const entry of section.advent_calendar?.AdventDay ?? []) {
			const day = Number(entry?.Day)
			if (day >= 1 && day <= 24 && !map.has(day)) {
				map.set(day, entry)
			}
		}
		return map
	}, [section.advent_calendar])

	const selected = selectedDay == null ? null : daysByNumber.get(selectedDay) ?? null
	const imageUrl = resolveMediaUrl(selected?.AdventImage, strapiBaseUrl)
	const greeting = selected?.GreetingOfTheDay?.trim() ?? ''

	useEffect(() => () => {
		if (openTimer.current != null) {
			window.clearTimeout(openTimer.current)
		}
	}, [])

	const backgroundColor = adventBackgroundColor(
		section.advent_calendar?.Hintergrundfarbe,
	)
	const heading = (
		<h2
			id={titleId}
			className='relative text-center text-2xl tracking-wide text-[#f4e7c5] sm:text-4xl'
		>
			HZD Adventskalender {moment.year}
		</h2>
	)

	if (isAdventSectionHidden(moment)) {
		return null
	}

	if (isAdventAnnouncementVisible(moment)) {
		return (
			<SectionContainer
				variant='full-width'
				backgroundColor={backgroundColor}
				paddingTop='2.5rem'
				paddingBottom='2.5rem'
			>
				<div className='relative mx-auto w-full max-w-5xl px-2 min-[1056px]:px-0'>
					{heading}
					<AdventAnnouncement
						content={section.advent_calendar?.Ankuendigung}
						image={section.advent_calendar?.KalenderPlatzhalter}
						imageUrl={resolveMediaUrl(
							section.advent_calendar?.KalenderPlatzhalter,
							strapiBaseUrl,
						)}
					/>
				</div>
			</SectionContainer>
		)
	}
	const featuredDay = Math.min(moment.day, 24)
	const featured = daysByNumber.get(featuredDay) ?? null
	const featuredImageUrl = resolveMediaUrl(featured?.AdventImage, strapiBaseUrl)
	const featuredGreeting = featured?.GreetingOfTheDay?.trim() ?? ''

	const openDoor = (day: number) => {
		if (!isDoorOpenable(moment, day)) {
			return
		}

		setOpeningDay(day)
		if (openTimer.current != null) {
			window.clearTimeout(openTimer.current)
		}
		openTimer.current = window.setTimeout(() => {
			setSelectedDay(day)
			setOpeningDay(null)
			openTimer.current = null
		}, 180)
	}

	return (
		<SectionContainer
			variant='full-width'
			backgroundColor={backgroundColor}
			paddingTop='2.5rem'
			paddingBottom='2.5rem'
		>
			<div className='relative mx-auto w-full max-w-5xl px-2 min-[1056px]:px-0'>
				<Snowfall />
				<div className='mb-6'>{heading}</div>
				<figure className='relative mx-auto w-full'>
					{featuredImageUrl ? (
						<Image
							src={featuredImageUrl}
							alt={featured?.AdventImage?.alternativeText || `Adventsbild zum ${featuredDay}. Dezember`}
							width={featured?.AdventImage?.width ?? 1600}
							height={featured?.AdventImage?.height ?? 1000}
							className='h-auto max-h-[70vh] w-full rounded-xl object-contain'
							unoptimized
							priority
						/>
					) : (
						<p className='px-4 pt-6 text-center text-[#f4e7c5]'>
							Für den {featuredDay}. Dezember ist noch kein Bild hinterlegt.
						</p>
					)}
					{featuredGreeting ? (
						<figcaption className='mt-5 whitespace-pre-line text-center text-lg leading-relaxed text-[#f4e7c5]'>
							{featuredGreeting}
						</figcaption>
					) : null}
				</figure>
				<button
					type='button'
					role='switch'
					aria-checked={showDoors}
					className='relative mx-auto mt-8 flex w-fit items-center gap-3 rounded-full text-[#f4e7c5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4'
					style={{ outlineColor: theme.buttonColor }}
					onClick={() => setShowDoors((current) => !current)}
				>
					<span
						className={`relative h-8 w-14 rounded-full border border-[#f4e7c5]/40 transition-colors ${showDoors ? 'bg-[#d4b46a]' : 'bg-[#234e3a]'}`}
						aria-hidden
					>
						<span
							className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-[#f4e7c5] shadow transition-transform ${showDoors ? 'translate-x-6' : ''}`}
						/>
					</span>
					Kalendertürchen anzeigen
				</button>
				{showDoors ? (
				<div className='relative mt-8 grid grid-flow-dense grid-cols-2 auto-rows-[5.75rem] gap-2.5 sm:auto-rows-[6.5rem] sm:gap-3 lg:grid-cols-6 lg:auto-rows-[7rem]'>
					{VISUAL_ORDER.map((day) => {
						const openable = isDoorOpenable(moment, day)
						const entry = daysByNumber.get(day)
						const face = faceFor(day)
						const doorFaceUrl = resolveMediaUrl(entry?.TuerchenImage, strapiBaseUrl)
						const hoverLabel = doorHoverLabel(day, moment.year)
						const thumbUrl = openable
							? resolveThumbnailUrl(entry?.AdventImage, strapiBaseUrl)
							: null
						const label = openable
							? `Türchen ${day} öffnen`
							: `Türchen ${day}, öffnet am ${day}. Dezember`

						return (
							<div
								key={day}
								className={`group relative h-full ${spanClass(day)}`}
								title={hoverLabel}
							>
								<button
									type='button'
									className={`advent-door h-full w-full relative overflow-hidden rounded-2xl shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${!openable ? 'pointer-events-none' : ''} ${openingDay === day ? 'is-opening' : ''}`}
									style={{
										backgroundColor,
										outlineColor: theme.buttonColor,
										boxShadow: '0 10px 18px rgba(0,0,0,0.28)',
									}}
									disabled={!openable}
									aria-label={label}
									title={hoverLabel}
									onClick={() => openDoor(day)}
								>
									{thumbUrl ? (
										<Image
											src={thumbUrl}
											alt=''
											fill
											className='object-cover'
											unoptimized
											sizes='(max-width: 640px) 50vw, 220px'
										/>
									) : null}
									{doorFaceUrl ? (
										<span className='advent-door-flap absolute inset-0'>
											<Image
												src={doorFaceUrl}
												alt=''
												fill
												className='object-cover'
												unoptimized
												sizes='(max-width: 640px) 50vw, 220px'
											/>
										</span>
									) : (
										<span
											className='advent-door-flap absolute inset-0 flex items-center justify-center'
											style={{
												backgroundColor: face.background,
												color: face.color,
												boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
											}}
										>
											{face.snow ? (
												<span
													className='pointer-events-none absolute inset-x-0 top-0 h-4 bg-white'
													style={{ clipPath: 'ellipse(62% 100% at 50% 0%)' }}
												/>
											) : null}
											<DoorPattern face={face} />
											<span
												className={`relative font-serif leading-none ${day === 24 ? 'text-6xl sm:text-7xl' : 'text-3xl sm:text-4xl'}`}
												style={{ textShadow: '0 2px 0 rgba(0,0,0,0.12)' }}
											>
												{day}
											</span>
										</span>
									)}
								</button>
								{!openable ? (
									<span
										className='pointer-events-none absolute right-1.5 bottom-1.5 z-20'
										aria-hidden
									>
										<ClosedPadlock
											large={day === 24}
											color={face.color}
										/>
									</span>
								) : null}
								{hoverLabel ? (
									<span
										role='tooltip'
										className='pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-30 hidden w-max -translate-x-1/2 whitespace-nowrap rounded-md bg-[#f4e7c5] px-2.5 py-1.5 text-center text-xs leading-snug text-[#1c3358] shadow-lg group-hover:block group-focus-within:block'
									>
										{hoverLabel}
									</span>
								) : null}
							</div>
						)
					})}
				</div>
				) : null}
			</div>
			{selectedDay != null ? createPortal(
				<DoorDialog
					day={selectedDay}
					titleId={dialogTitleId}
					image={selected?.AdventImage}
					imageUrl={imageUrl}
					greeting={greeting}
					onClose={() => setSelectedDay(null)}
				/>,
				document.body,
			) : null}
		</SectionContainer>
	)
}

interface DoorDialogProps {
	day: number
	titleId: string
	image?: MediaImage | null
	imageUrl: string | null
	greeting: string
	onClose: () => void
}

function DoorDialog({
	day,
	titleId,
	image,
	imageUrl,
	greeting,
	onClose,
}: DoorDialogProps) {
	const closeRef = useRef<HTMLButtonElement>(null)
	const onCloseRef = useRef(onClose)
	onCloseRef.current = onClose

	useEffect(() => {
		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		closeRef.current?.focus()

		const handleKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onCloseRef.current()
			}
		}

		window.addEventListener('keydown', handleKey)
		return () => {
			document.body.style.overflow = previousOverflow
			window.removeEventListener('keydown', handleKey)
		}
	}, [])

	return (
		<div
			className='fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4'
			onClick={onClose}
		>
			<div
				role='dialog'
				aria-modal='true'
				aria-labelledby={titleId}
				className='relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-[#143028] p-4 shadow-2xl sm:p-6'
				onClick={(event) => event.stopPropagation()}
			>
				<h3 id={titleId} className='sr-only'>
					Türchen {day}
				</h3>
				<button
					ref={closeRef}
					type='button'
					className='absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-3xl leading-none text-white hover:bg-black/65'
					aria-label='Schließen'
					onClick={onClose}
				>
					×
				</button>
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={image?.alternativeText || `Adventsbild zum ${day}. Dezember`}
						width={image?.width ?? 1600}
						height={image?.height ?? 1000}
						className='h-auto max-h-[70vh] w-full rounded-xl object-contain'
						unoptimized
					/>
				) : (
					<p className='px-8 pt-10 text-center text-[#f4e7c5]'>
						Für den {day}. Dezember ist noch kein Bild hinterlegt.
					</p>
				)}
				{greeting ? (
					<p className='mt-5 whitespace-pre-line text-center text-lg leading-relaxed text-[#f4e7c5]'>
						{greeting}
					</p>
				) : null}
			</div>
		</div>
	)
}

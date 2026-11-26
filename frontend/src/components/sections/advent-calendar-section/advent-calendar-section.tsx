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
	SECTION_PADDING,
	sectionPaddingBottom,
	sectionPaddingTop,
} from '@/lib/section-padding'
import { AiNoteLabel } from '@/components/common/ai-note-label'
import {
	isAdventAnnouncementVisible,
	isAdventClosingVisible,
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
	imageAlt,
	aiNote,
}: {
	content?: BlocksContent | null
	image?: MediaImage | null
	imageUrl?: string | null
	imageAlt?: string
	aiNote?: string | null
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
			<div className='relative'>
				<Image
					src={imageUrl}
					alt={image?.alternativeText || imageAlt || 'Adventskalender'}
					width={image?.width ?? 800}
					height={image?.height ?? 800}
					className='h-auto w-full rounded-xl object-contain'
					unoptimized
				/>
				<AiNoteLabel note={aiNote} />
			</div>
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

const NIGHT_STARS = Array.from({ length: 24 }, (_, index) => ({
	id: index,
	left: `${(index * 17 + 4) % 94}%`,
	top: `${(index * 29 + 6) % 86}%`,
	size: index % 7 === 0 ? 16 : index % 3 === 0 ? 9 : 3,
	delay: `${(index % 8) * 0.45}s`,
	duration: `${2.8 + (index % 5) * 0.7}s`,
	twinkle: index % 4 !== 2,
	opacity: 0.4 + (index % 5) * 0.12,
}))

interface StarFlight {
	angle: string
	dx: string
	dy: string
	left: string
	top: string
}

function randomFlight(): StarFlight {
	const angle = Math.random() * 360
	const rad = (angle * Math.PI) / 180
	const distance = 46 + Math.random() * 24
	const dx = Math.cos(rad) * distance
	const dy = Math.sin(rad) * distance

	return {
		angle: `${angle.toFixed(1)}deg`,
		dx: `${dx.toFixed(1)}vw`,
		dy: `${dy.toFixed(1)}vw`,
		left: `${(50 - dx / 2).toFixed(1)}%`,
		top: `${(38 - dy / 2).toFixed(1)}%`,
	}
}

const INITIAL_FLIGHT: StarFlight = {
	angle: '0deg',
	dx: '50vw',
	dy: '0vw',
	left: '25%',
	top: '30%',
}

function ShootingStar({ late }: { late?: boolean }) {
	const nodeRef = useRef<HTMLSpanElement>(null)
	const [flight, setFlight] = useState(INITIAL_FLIGHT)

	useEffect(() => {
		setFlight(randomFlight())
		const node = nodeRef.current
		if (!node) {
			return
		}
		const handleIteration = () => {
			setFlight(randomFlight())
		}
		node.addEventListener('animationiteration', handleIteration)
		return () => {
			node.removeEventListener('animationiteration', handleIteration)
		}
	}, [])

	return (
		<span
			ref={nodeRef}
			className={`advent-shooting-star${late ? ' advent-shooting-star-late' : ''}`}
			style={{
				left: flight.left,
				top: flight.top,
				['--star-angle' as string]: flight.angle,
				['--star-dx' as string]: flight.dx,
				['--star-dy' as string]: flight.dy,
			}}
		/>
	)
}

function NightSky() {
	const maskId = useId().replace(/:/g, '')

	return (
		<div
			className='pointer-events-none absolute inset-x-0 overflow-hidden'
			style={{ top: '-2.5rem', bottom: '-2.5rem' }}
			aria-hidden
		>
			<span className='absolute top-3 right-[6%] h-20 w-20 sm:top-5 sm:h-28 sm:w-28'>
				<span className='absolute inset-2 rounded-full bg-[#ffe56a]/30 blur-xl' />
				<svg viewBox='0 0 64 64' className='relative h-full w-full'>
					<mask id={maskId}>
						<rect width='64' height='64' fill='black' />
						<circle cx='28' cy='34' r='18' fill='white' />
						<circle cx='40' cy='28' r='16' fill='black' />
					</mask>
					<rect
						width='64'
						height='64'
						fill='#ffe14a'
						mask={`url(#${maskId})`}
					/>
				</svg>
			</span>
			{NIGHT_STARS.map((star) => (
				<span
					key={star.id}
					className={`absolute text-[#fff4c4] ${star.twinkle ? 'advent-star-twinkle' : ''}`}
					style={{
						left: star.left,
						top: star.top,
						opacity: star.opacity,
						animationDelay: star.delay,
						animationDuration: star.duration,
					}}
				>
					{star.size <= 4 ? (
						<span
							className='block rounded-full bg-[#fff6c8]'
							style={{ width: star.size, height: star.size }}
						/>
					) : (
						<svg
							viewBox='0 0 16 16'
							width={star.size}
							height={star.size}
							aria-hidden
						>
							<path
								fill='currentColor'
								d='M8 0 9.3 6.1 16 8 9.3 9.9 8 16 6.7 9.9 0 8 6.7 6.1Z'
							/>
						</svg>
					)}
				</span>
			))}
			<ShootingStar />
			<ShootingStar late />
		</div>
	)
}

const SNOW_LAYERS = [
	{
		id: 'far',
		count: 16,
		minDuration: 22,
		durationSpan: 6,
		minSize: 2,
		sizeSpan: 1,
		opacity: 0.4,
		drift: 8,
	},
	{
		id: 'mid',
		count: 12,
		minDuration: 13,
		durationSpan: 4,
		minSize: 5,
		sizeSpan: 2,
		opacity: 0.62,
		drift: 18,
	},
	{
		id: 'near',
		count: 8,
		minDuration: 7,
		durationSpan: 2,
		minSize: 9,
		sizeSpan: 3,
		opacity: 0.88,
		drift: 32,
	},
] as const

function Snowfall() {
	const layers = useMemo(() => (
		SNOW_LAYERS.map((layer, layerIndex) => ({
			id: layer.id,
			zIndex: layerIndex,
			flakes: Array.from({ length: layer.count }, (_, index) => ({
				id: `${layer.id}-${index}`,
				left: `${(index * 37 + layerIndex * 19) % 100}%`,
				delay: `${(index % 8) * 0.8}s`,
				duration: `${layer.minDuration + (index % (layer.durationSpan + 1))}s`,
				size: layer.minSize + (index % (layer.sizeSpan + 1)),
				opacity: layer.opacity,
				drift: `${layer.drift}px`,
			})),
		}))
	), [])

	return (
		<div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden>
			{layers.map((layer) => (
				<div
					key={layer.id}
					className='absolute inset-0'
					style={{ zIndex: layer.zIndex }}
				>
					{layer.flakes.map((flake) => (
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
								['--snow-drift' as string]: flake.drift,
							}}
						/>
					))}
				</div>
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
	const calendar = section.advent_calendar
	const moment = resolveAdventMoment(section.TestDate)
	const jahr = calendar?.Jahr ?? null
	const titleId = useId()
	const dialogTitleId = useId()
	const [selectedDay, setSelectedDay] = useState<number | null>(null)
	const [openingDay, setOpeningDay] = useState<number | null>(null)
	const [showDoors, setShowDoors] = useState(false)
	const openTimer = useRef<number | null>(null)

	const daysByNumber = useMemo(() => {
		const map = new Map<number, AdventDay>()
		for (const entry of calendar?.AdventDay ?? []) {
			const day = Number(entry?.Day)
			if (day >= 1 && day <= 24 && !map.has(day)) {
				map.set(day, entry)
			}
		}
		return map
	}, [calendar])

	const selected = selectedDay == null ? null : daysByNumber.get(selectedDay) ?? null
	const imageUrl = resolveMediaUrl(selected?.AdventImage, strapiBaseUrl)
	const greeting = selected?.GreetingOfTheDay?.trim() ?? ''

	useEffect(() => () => {
		if (openTimer.current != null) {
			window.clearTimeout(openTimer.current)
		}
	}, [])

	const backgroundColor = adventBackgroundColor(
		calendar?.Hintergrundfarbe,
	)
	const paddingConfig = SECTION_PADDING.adventCalendar
	const paddingTop = sectionPaddingTop(paddingConfig, section.AdventKalenderPadding?.Top)
	const paddingBottom = sectionPaddingBottom(paddingConfig, section.AdventKalenderPadding?.Bottom)
	const heading = (
		<h2
			id={titleId}
			className='relative text-center text-2xl tracking-wide text-[#f4e7c5] sm:text-4xl'
		>
			HZD Adventskalender {jahr ?? ''}
		</h2>
	)

	if (jahr == null || isAdventSectionHidden(moment, calendar)) {
		return null
	}

	if (isAdventAnnouncementVisible(moment, calendar)) {
		return (
			<SectionContainer
				variant='full-width'
				backgroundColor={backgroundColor}
				paddingTop={paddingTop}
				paddingBottom={paddingBottom}
			>
				<div className='relative w-full'>
					<NightSky />
				<div className='relative mx-auto w-full max-w-5xl px-2 min-[1056px]:px-0'>
					{heading}
					<AdventAnnouncement
						content={calendar?.Ankuendigung}
						image={calendar?.KalenderPlatzhalter}
						imageUrl={resolveMediaUrl(
							calendar?.KalenderPlatzhalter,
							strapiBaseUrl,
						)}
						aiNote={calendar?.KalenderPlatzhalterAiNote}
					/>
				</div>
				</div>
			</SectionContainer>
		)
	}
	const isClosing = isAdventClosingVisible(moment, calendar)
	const featuredDay = Math.min(moment.day, 24)
	const featured = daysByNumber.get(featuredDay) ?? null
	const featuredImageUrl = resolveMediaUrl(featured?.AdventImage, strapiBaseUrl)
	const featuredGreeting = featured?.GreetingOfTheDay?.trim() ?? ''

	const openDoor = (day: number) => {
		if (!isDoorOpenable(moment, day, calendar)) {
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
			paddingTop={paddingTop}
			paddingBottom={paddingBottom}
		>
			<div className='relative w-full'>
				<NightSky />
			<div className='relative mx-auto w-full max-w-5xl px-2 min-[1056px]:px-0'>
				<Snowfall />
				<div className={isClosing ? undefined : 'mb-6'}>{heading}</div>
				{isClosing ? (
					<AdventAnnouncement
						content={calendar?.SchlussGruesse}
						image={calendar?.SchlussBild}
						imageUrl={resolveMediaUrl(
							calendar?.SchlussBild,
							strapiBaseUrl,
						)}
						imageAlt='Schlussbild des Adventskalenders'
						aiNote={calendar?.SchlussBildAiNote}
					/>
				) : (
				<figure className='relative mx-auto w-full'>
					<p className='relative mb-4 text-center text-lg text-[#f4e7c5]'>
						Dein Türchenbild von heute, dem {moment.day}.{moment.month}.{jahr}
					</p>
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
				)}
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
						const openable = isDoorOpenable(moment, day, calendar)
						const entry = daysByNumber.get(day)
						const face = faceFor(day)
						const doorFaceUrl = resolveMediaUrl(entry?.TuerchenImage, strapiBaseUrl)
						const hoverLabel = doorHoverLabel(day, jahr)
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
			</div>
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

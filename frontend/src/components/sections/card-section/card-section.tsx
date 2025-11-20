'use client'

import type { CardItem, CardSection } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { getThemeById, type ThemeId } from '@/themes'

interface CardSectionComponentProps {
	section: CardSection
	strapiBaseUrl: string
}

function getThemeColor(themeId: ThemeId | null | undefined): string {
	if (!themeId) {
		return '#64574E'
	}
	const theme = getThemeById(themeId)
	return theme.headerBackground
}

function getButtonTextColor(themeId: ThemeId | null | undefined): string {
	if (!themeId) {
		return '#000000'
	}
	const theme = getThemeById(themeId)
	return theme.headerFooterTextColor
}

export function CardSectionComponent({
	section,
	strapiBaseUrl,
}: CardSectionComponentProps) {
	const cards =
		section.CardItem?.filter(
			(card): card is CardItem => Boolean(card),
		) ?? []

	if (cards.length === 0) {
		return null
	}

	return (
		<section className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div className='grid w-full max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3'>
				{cards.map((card, index) => {
					const key = card.id ?? card.Headline ?? `card-${index}`
					const imageUrl = resolveMediaUrl(card.BackgroundImage, strapiBaseUrl)
					const themeColor = getThemeColor(card.FarbThema)
					const buttonTextColor = getButtonTextColor(card.FarbThema)

					return (
						<article
							key={key}
							className='group relative flex min-h-[400px] flex-col overflow-hidden rounded-lg bg-gray-900 text-white shadow-lg transition-transform hover:-translate-y-1'
						>
							{/* Farbiger Balken oben */}
							<div
								className='h-1 w-full'
								style={{ backgroundColor: themeColor }}
							/>

							{/* Bild-Container mit Backdrop */}
							<div className='relative flex-1 overflow-hidden'>
								{imageUrl ? (
									<div
										className='absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105'
										style={{ backgroundImage: `url('${imageUrl}')` }}
									/>
								) : null}
								{/* Dunkles Backdrop Overlay */}
								<div className='absolute inset-0 bg-black/60' />

								{/* Text-Container über dem Bild */}
								<div className='relative z-10 flex h-full flex-col justify-end gap-3 px-6 py-8'>
									{card?.Headline ? (
										<h3 className='text-2xl font-semibold text-white'>
											{card.Headline}
										</h3>
									) : null}
									{card?.Subheadline ? (
										<p className='text-sm text-white/90'>
											{card.Subheadline}
										</p>
									) : null}
									{card?.ActionButton?.Link ? (
										<a
											href={card.ActionButton.Link}
											className='mt-4 inline-flex w-fit items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90'
											style={{
												backgroundColor: themeColor,
												color: buttonTextColor,
											}}
										>
											{card.ActionButton.Label ?? 'Mehr erfahren'}
										</a>
									) : null}
								</div>
							</div>
						</article>
					)
				})}
			</div>
		</section>
	)
}


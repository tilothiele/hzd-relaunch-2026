'use client'

import type { CardItem, CardSection } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface CardSectionComponentProps {
	section: CardSection
	strapiBaseUrl: string
}

const cardThemeClasses: Record<
	NonNullable<CardItem['FarbThema']>,
	string
> = {
	A: 'from-yellow-200/70 to-yellow-400/70',
	B: 'from-teal-200/70 to-teal-400/70',
	C: 'from-pink-200/70 to-pink-400/70',
}

function getCardGradientClass(card: CardItem | null | undefined) {
	if (!card?.FarbThema) {
		return 'from-black/50 to-black/40'
	}

	return cardThemeClasses[card.FarbThema] ?? 'from-black/50 to-black/40'
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
		<section className='mb-16 px-4'>
			<div className='mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3'>
				{cards.map((card, index) => {
					const key = card.id ?? card.Headline ?? `card-${index}`
					const imageUrl = resolveMediaUrl(card.BackgroundImage, strapiBaseUrl)
					const gradientClass = getCardGradientClass(card)

					return (
						<article
							key={key}
							className='group relative flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-3xl bg-gray-900 text-white shadow-lg transition-transform hover:-translate-y-1'
						>
							{imageUrl ? (
								<div
									className='absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105'
									style={{ backgroundImage: `url('${imageUrl}')` }}
								/>
							) : null}
							<div
								className={`absolute inset-0 bg-gradient-to-t ${gradientClass}`}
							/>
							<div className='relative z-10 flex flex-col gap-3 px-6 py-8'>
								{card?.Headline ? (
									<h3 className='text-2xl font-semibold'>
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
										className='mt-4 inline-flex w-fit items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900 transition-opacity hover:opacity-90'
									>
										{card.ActionButton.Label ?? 'Mehr erfahren'}
									</a>
								) : null}
							</div>
						</article>
					)
				})}
			</div>
		</section>
	)
}


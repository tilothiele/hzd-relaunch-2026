'use client'

import { Box, Card, CardContent, Typography } from '@mui/material'
import type { CardItem, CardSection } from '@/types'
import { theme as globalTheme, type ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { BorderedCardItem } from './bordered-card-item'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface CardSectionComponentProps {
	section: CardSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

function getThemeColor(): string {
	return globalTheme.headerBackground
}

export function CardSectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: CardSectionComponentProps) {
	const { elementRef, isVisible } = useScrollAnimation({
		threshold: 0.1,
		triggerOnce: false,
	})

	const cards =
		section.CardItem?.filter(
			(card): card is CardItem => Boolean(card),
		) ?? []

	if (cards.length === 0) {
		return null
	}

	const backgroundColor = section.CardColumnsOddEven === 'Odd' ? theme.oddBgColor : theme.evenBgColor
	const isBorderedBox = section.CardLayout === 'Bordered_Box'

	if (isBorderedBox) {
		return (
			<SectionContainer
				variant='max-width'
				id={section.CardsAnchor || undefined}
				backgroundColor={backgroundColor}
				paddingTop='3em'
				paddingBottom='3em'
			>
				{section.CardHeadline && (
					<Typography
						variant='h4'
						component='h2'
						sx={{
							textAlign: 'center',
							fontWeight: 700,
							mb: 6,
							color: theme.headlineColor
						}}
					>
						{section.CardHeadline}
					</Typography>
				)}

				<Box
					ref={elementRef}
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: '1fr',
							md: 'repeat(2, 1fr)',
							lg: 'repeat(3, 1fr)',
						},
						gap: 4,
						opacity: isVisible ? 1 : 0,
						transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
						transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
					}}
				>
					{cards.map((card, index) => {
						const key = card.id ?? card.Headline ?? `card-${index}`

						return (
							<BorderedCardItem
								key={key}
								card={card}
								strapiBaseUrl={strapiBaseUrl}
								theme={theme}
							/>
						)
					})}
				</Box>
			</SectionContainer>
		)
	}

	return (
		<SectionContainer
			variant='full-width'
			id={section.CardsAnchor || undefined}
			backgroundColor={backgroundColor}
		>
			<Box
				ref={elementRef}
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					width: '100%',
					margin: 0,
					opacity: isVisible ? 1 : 0,
					transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
					transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
				}}
			>
				{cards.map((card, index) => {
					const key = card.id ?? card.Headline ?? `card-${index}`
					const imageUrl = resolveMediaUrl(card.BackgroundImage, strapiBaseUrl)
					const themeColor = getThemeColor()
					const currentCardTheme = globalTheme

					return (
						<Box
							key={key}
							sx={{
								width: { xs: '100%', md: '50%', lg: '33.333%' },
								flexGrow: 0,
								flexShrink: 0,
							}}
						>
							<Card
								sx={{
									position: 'relative',
									minHeight: 400,
									display: 'flex',
									flexDirection: 'column',
									overflow: 'hidden',
									backgroundColor: theme.cardsBackground,
									color: theme.cardsText,
									boxShadow: 3,
									borderTopLeftRadius: 0,
									borderTopRightRadius: 0,
									borderBottomLeftRadius: 0,
									borderBottomRightRadius: 0,
								}}
							>
								{/* Bild-Container mit Backdrop */}
								<Box
									sx={{
										position: 'relative',
										flex: 1,
										overflow: 'hidden',
									}}
								>
									{imageUrl ? (
										<Box
											sx={{
												position: 'absolute',
												inset: 0,
												backgroundImage: `url('${imageUrl}')`,
												backgroundSize: 'cover',
												backgroundPosition: 'center',
											}}
										/>
									) : null}
									{/* Dunkles Backdrop Overlay */}
									<Box
										sx={{
											position: 'absolute',
											inset: 0,
											backgroundColor: 'rgba(0, 0, 0, 0.4)',
										}}
									/>

									{/* Text-Container über dem Bild */}
									<CardContent
										sx={{
											position: 'absolute',
											bottom: 0,
											left: 0,
											right: 0,
											zIndex: 10,
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'flex-end',
											gap: 1.5,
											px: 3,
											pb: 3,
											pt: 4,
										}}
									>
										{card?.Headline ? (
											<Typography
												variant='h5'
												component='h3'
												sx={{
													fontWeight: 600,
													color: theme.imageCardSectionText,
													textAlign: 'center',
													mb: 2,
												}}
											>
												{card.Headline}
											</Typography>
										) : null}
										{card?.Subheadline ? (
											<Typography
												variant='body2'
												sx={{
													color: theme.cardsText,
													opacity: 0.9,
													textAlign: 'center',
													mb: 2,
												}}
											>
												{card.Subheadline}
											</Typography>
										) : null}
										{card?.ActionButton ? (
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'center',
													mb: 2,
												}}
											>
												<ActionButton
													actionButton={card.ActionButton}
													theme={currentCardTheme}
												/>
											</Box>
										) : null}
									</CardContent>
								</Box>
							</Card>
						</Box>
					)
				})}
			</Box>
		</SectionContainer>
	)
}


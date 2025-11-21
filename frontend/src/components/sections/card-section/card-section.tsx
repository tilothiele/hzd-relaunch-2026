'use client'

import { Box, Card, CardContent, Typography } from '@mui/material'
import type { CardItem, CardSection } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { getThemeById, type ThemeId } from '@/themes'
import { ActionButton } from '@/components/ui/action-button'

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
		<Box
			component='section'
			sx={{
				width: '100%',
				pb: 2,
			}}
		>
			<Box
				sx={{
					display: 'flex',
					flexWrap: 'wrap',
					width: '100%',
					margin: 0,
				}}
			>
				{cards.map((card, index) => {
					const key = card.id ?? card.Headline ?? `card-${index}`
					const imageUrl = resolveMediaUrl(card.BackgroundImage, strapiBaseUrl)
					const themeColor = getThemeColor(card.FarbThema)
					const theme = card.FarbThema ? getThemeById(card.FarbThema) : null

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
									backgroundColor: '#1f2937',
									color: 'white',
									boxShadow: 3,
									transition: 'transform 0.3s ease-in-out',
									'&:hover': {
										transform: 'translateY(-4px)',
									},
								}}
							>
								{/* Farbiger Balken oben */}
								<Box
									sx={{
										height: 12,
										width: '100%',
										backgroundColor: themeColor,
									}}
								/>

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
												transition: 'transform 0.7s ease-in-out',
												'&:hover': {
													transform: 'scale(1.05)',
												},
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
													color: 'white',
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
													color: 'rgba(255, 255, 255, 0.9)',
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
													theme={theme}
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
		</Box>
	)
}


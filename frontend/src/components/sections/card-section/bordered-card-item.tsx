import { Box, Card, CardContent, CardMedia, Typography } from '@mui/material'
import Image from 'next/image'
import type { CardItem } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'

interface BorderedCardItemProps {
    card: CardItem
    strapiBaseUrl: string
    theme: ThemeDefinition
    isUnread?: boolean
}

export function BorderedCardItem({ card, strapiBaseUrl, theme, isUnread }: BorderedCardItemProps) {
    const imageUrl = resolveMediaUrl(card.BackgroundImage, strapiBaseUrl)

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderTop: `6px solid ${theme.headerBackground}`, // Blueish top border
                borderRadius: 0,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                backgroundColor: '#f3f4f6', // Light gray background essentially white/light
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                },
            }}
        >
            {imageUrl && (
                <Box sx={{ position: 'relative', width: '100%', paddingTop: '60%' }}>
                    <Image
                        src={imageUrl}
                        alt={card.BackgroundImage?.alternativeText ?? card.Headline ?? ''}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                    />
                </Box>
            )}

            <CardContent sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: 4,
                gap: 2
            }}>
                {card.Headline && (
                    <Typography
                        variant='h6'
                        component='h3'
                        sx={{
                            color: theme.headerBackground, // Use primary/header color for headline
                            fontWeight: isUnread ? 900 : 700,
                            textTransform: 'uppercase',
                            lineHeight: 1.2,
                        }}
                    >
                        {card.Headline}
                    </Typography>
                )}

                {card.Subheadline && (
                    <Typography
                        variant='body1'
                        sx={{
                            color: theme.cardsText,
                            lineHeight: 1.6,
                        }}
                    >
                        {card.Subheadline}
                    </Typography>
                )}

                {card.ActionButton && (
                    <Box sx={{ marginTop: 'auto', paddingTop: 2 }}>
                        <ActionButton actionButton={card.ActionButton} theme={theme} />
                    </Box>
                )}
            </CardContent>
        </Card>
    )
}


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
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
                boxShadow: 'none',
                backgroundColor: 'var(--color-cards-background)', // Light gray background essentially white/light
                transition: 'transform 0.2s',
            }}
            className="hover:-translate-y-1 hover:shadow-lg group"
        >
            {imageUrl && (
                <div style={{ position: 'relative', width: '100%', paddingTop: '60%' }}>
                    <Image
                        src={imageUrl}
                        alt={card.BackgroundImage?.alternativeText ?? card.Headline ?? ''}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                    />
                </div>
            )}

            <div style={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '32px', // p-8 equivalent to MUI spacing(4) -> 4 * 8px = 32px
                gap: '16px' // gap-4 equivalent to MUI spacing(2) -> 2 * 8px = 16px
            }}>
                {card.Headline && (
                    <h3
                        style={{
                            color: theme.cardsTextHeadline,
                            fontWeight: isUnread ? 900 : 700,
                            lineHeight: 1.2,
                            margin: 0
                        }}
                    >
                        {card.Headline}
                    </h3>
                )}

                {card.Subheadline && (
                    <p
                        style={{
                            color: theme.cardsTextSubheadline,
                            lineHeight: 1.6,
                            fontSize: '1rem', // ~body1
                            margin: 0
                        }}
                    >
                        {card.Subheadline}
                    </p>
                )}

                {card.TeaserText && (
                    <p
                        style={{
                            color: theme.cardsText,
                            lineHeight: 1.5,
                            marginTop: '8px',
                            margin: 0
                        }}
                    >
                        {card.TeaserText}
                    </p>
                )}

                {card.ActionButton && (
                    <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                        <ActionButton actionButton={card.ActionButton} theme={theme} />
                    </div>
                )}
            </div>
        </div>
    )
}

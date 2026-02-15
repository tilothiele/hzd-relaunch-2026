'use client'

import { Card, CardContent, Typography, Box, Button } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'
import type { NewsArticle } from '@/lib/server/news-utils'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { resolveTagColors } from '@/lib/color-utils'

interface NewsCardListViewProps {
    article: NewsArticle
    strapiBaseUrl: string
    theme: ThemeDefinition
    isUnread?: boolean
}

export function NewsCardListView({ article, strapiBaseUrl, theme, isUnread }: NewsCardListViewProps) {
    const imageUrl = resolveMediaUrl(article.Image, strapiBaseUrl)
    const dateToUse = article.DateOfPublication || article.publishedAt
    const formattedDate = dateToUse
        ? new Date(dateToUse).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
        : null

    return (
        <Link href={`/article${article.Slug}`} style={{ textDecoration: 'none' }}>
            <Card
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    height: (!imageUrl && !article.TeaserText) ? 'auto' : { sm: '180px' }, // Fixed height for desktop only if content needs space
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    },
                }}
            >
                {imageUrl && (
                    <Box sx={{ position: 'relative', width: { xs: '100%', sm: '240px' }, minWidth: { sm: '240px' }, height: { xs: '200px', sm: 'auto' } }}>
                        <Image
                            src={imageUrl}
                            alt={article.Image?.alternativeText || article.Headline || ''}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                        />
                    </Box>
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                    {/* Top Line: Category, Date, Headline */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            {isUnread && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        backgroundColor: theme.submitButtonColor,
                                        color: theme.submitButtonTextColor,
                                        px: 1,
                                        py: 0.25,
                                        borderRadius: 0.5,
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        fontSize: '0.7rem'
                                    }}
                                >
                                    Ungelesen
                                </Typography>
                            )}
                            {formattedDate && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    {formattedDate}
                                </Typography>
                            )}
                            {article.news_article_tags && article.news_article_tags.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {article.news_article_tags.map((tag) => {
                                        const { color, backgroundColor } = resolveTagColors(tag)
                                        return (
                                            <Box
                                                key={tag.Label}
                                                component="span"
                                                sx={{
                                                    backgroundColor,
                                                    color,
                                                    px: 1,
                                                    py: 0.25,
                                                    borderRadius: 1,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {tag.Label}
                                            </Box>
                                        )
                                    })}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                            color: theme.textColor,
                            fontWeight: 800,
                            lineHeight: 1.2,
                            mb: 1,
                            fontSize: '1.1rem'
                        }}
                    >
                        {article.Headline}
                    </Typography>

                    {/* Bottom Line: Teaser Text */}
                    {article.TeaserText && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: theme.textColor,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.5
                            }}
                        >
                            {article.TeaserText}
                        </Typography>
                    )}


                </CardContent>
            </Card>
        </Link>
    )
}

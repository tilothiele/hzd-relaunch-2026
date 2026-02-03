'use client'

import { Card, CardContent, Typography, Box } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'
import type { ThemeDefinition } from '@/themes'
import type { NewsArticle } from '@/lib/server/news-utils'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface NewsCardProps {
    article: NewsArticle
    strapiBaseUrl: string
    theme: ThemeDefinition
    isUnread?: boolean
}

export function NewsCard({ article, strapiBaseUrl, theme, isUnread }: NewsCardProps) {
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
        <Link href={`/article/${article.Slug}`} style={{ textDecoration: 'none' }}>
            <Card
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    },
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {imageUrl && (
                    <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                        <Image
                            src={imageUrl}
                            alt={article.Image?.alternativeText || article.Headline || ''}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                        />
                    </Box>
                )}

                <CardContent sx={{ flexGrow: 1, padding: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {article.category?.CategoryName && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        backgroundColor: theme.headerBackground,
                                        color: theme.buttonTextColor,
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {article.category.CategoryName}
                                </Typography>
                            )}
                            {isUnread && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        backgroundColor: theme.submitButtonColor, // MUI error.main color
                                        color: theme.submitButtonTextColor,
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    Ungelesen
                                </Typography>
                            )}
                        </Box>
                        {formattedDate && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {formattedDate}
                            </Typography>
                        )}
                    </Box>

                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                            color: theme.textColor,
                            fontWeight: 900,
                            lineHeight: 1.3,
                            mb: 1
                        }}
                    >
                        {article.Headline}
                    </Typography>

                    {article.TeaserText && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: theme.textColor,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.6
                            }}
                        >
                            {article.TeaserText}
                        </Typography>
                    )}

                    <Box sx={{ mt: 'auto', pt: 2, display: 'flex', alignItems: 'center', color: theme.headerBackground, fontWeight: 700, fontSize: '0.875rem' }}>
                        Weiterlesen
                        <Box component="span" sx={{ ml: 1 }}>→</Box>
                    </Box>
                </CardContent>
            </Card>
        </Link>
    )
}

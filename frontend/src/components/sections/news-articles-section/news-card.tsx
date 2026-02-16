import { Card, CardContent, Typography, Box } from '@mui/material'
import Link from 'next/link'
import Image from 'next/image'
import type { ThemeDefinition } from '@/themes'
import type { NewsArticle } from '@/lib/server/news-utils'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { resolveTagColors } from '@/lib/color-utils'
import { ActionButton } from '@/components/ui/action-button'

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

    console.log(article)

    const articleLink = `/article/${article.Slug}`

    return (
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
                <Link href={articleLink} style={{ display: 'block', width: '100%', position: 'relative', paddingTop: '56.25%' }}>
                    <Image
                        src={imageUrl}
                        alt={article.Image?.alternativeText || article.Headline || ''}
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                    />
                </Link>
            )}

            <CardContent sx={{ flexGrow: 1, padding: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        {isUnread && (
                            <Typography
                                variant="caption"
                                sx={{
                                    backgroundColor: theme.submitButtonColor,
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

                <Link href={articleLink} style={{ textDecoration: 'none' }}>
                    <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                            color: theme.textColor,
                            fontWeight: 900,
                            lineHeight: 1.3,
                            mb: 1,
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }}
                    >
                        {article.Headline}
                    </Typography>
                </Link>

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

                <Box sx={{ mt: 'auto', pt: 2 }}>
                    <ActionButton
                        actionButton={{
                            Label: 'Weiterlesen',
                            Link: articleLink,
                            Primary: true
                        }}
                        theme={theme}
                        size='small'
                    />
                </Box>
            </CardContent>
        </Card>
    )
}

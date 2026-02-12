'use client'

import { useState, useEffect } from 'react'
import { getReadArticles } from '@/lib/client/db'
import type { NewsArticle } from '@/lib/server/news-utils'
import type { ThemeDefinition } from '@/themes'
import { NewsCard } from './news-card'
import { NewsCardListView } from './news-card-list-view'
import { Box } from '@mui/material'
import { ViewToggle } from '@/components/common/view-toggle'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { IconButton, Typography } from '@mui/material'

const MAX_LOOKBACK_YEARS = 5

interface NewsArticleListProps {
    articles: NewsArticle[]
    strapiBaseUrl: string
    theme: ThemeDefinition
}

export function NewsArticleList({ articles, strapiBaseUrl, theme }: NewsArticleListProps) {
    const [readArticles, setReadArticles] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
    const currentYear = new Date().getFullYear()
    const [selectedYear, setSelectedYear] = useState(currentYear)

    console.log('NewsArticleList rendering', { selectedYear, currentYear, articlesCount: articles.length })

    useEffect(() => {
        getReadArticles().then(setReadArticles).catch(console.error)
    }, [])

    const filteredArticles = articles.filter((article) => {
        if (!article.DateOfPublication) return false
        const date = new Date(article.DateOfPublication)
        return date.getFullYear() === selectedYear
    })

    const handlePrevYear = () => {
        if (selectedYear > currentYear - MAX_LOOKBACK_YEARS) {
            setSelectedYear(selectedYear - 1)
        }
    }

    const handleNextYear = () => {
        if (selectedYear < currentYear) {
            setSelectedYear(selectedYear + 1)
        }
    }



    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                        onClick={handlePrevYear}
                        disabled={selectedYear <= currentYear - MAX_LOOKBACK_YEARS}
                        aria-label="Previous Year"
                        sx={{
                            color: theme.buttonColor,
                            '&.Mui-disabled': { color: theme.drawerText + '80' }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: theme.headlineColor, fontWeight: 'bold' }}>
                        {selectedYear}
                    </Typography>
                    <IconButton
                        onClick={handleNextYear}
                        disabled={selectedYear >= currentYear}
                        aria-label="Next Year"
                        sx={{
                            color: theme.buttonColor,
                            '&.Mui-disabled': { color: theme.drawerText + '80' }
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </Box>

            {filteredArticles.length === 0 && (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: theme.textColor }}>
                    Keine Beiträge für das Jahr {selectedYear} gefunden.
                </Typography>
            )}

            {viewMode === 'cards' ? (
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                    gap: 4,
                }}>
                    {filteredArticles.map((article) => (
                        <NewsCard
                            key={article.documentId}
                            article={article}
                            strapiBaseUrl={strapiBaseUrl}
                            theme={theme}
                            isUnread={!readArticles.has(article.documentId)}
                        />
                    ))}
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {filteredArticles.map((article) => (
                        <NewsCardListView
                            key={article.documentId}
                            article={article}
                            strapiBaseUrl={strapiBaseUrl}
                            theme={theme}
                            isUnread={!readArticles.has(article.documentId)}
                        />
                    ))}
                </Box>
            )}
        </Box>
    )
}

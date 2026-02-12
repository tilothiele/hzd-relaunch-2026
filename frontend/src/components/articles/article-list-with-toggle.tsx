'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { ViewToggle } from '@/components/common/view-toggle'
import type { NewsArticle } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { ArticleCard } from './article-card'
import { NewsCardListView } from '@/components/sections/news-articles-section/news-card-list-view'
import { getReadArticles } from '@/lib/client/db'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { IconButton, Typography } from '@mui/material'

const MAX_LOOKBACK_YEARS = 5

interface ArticleListWithToggleProps {
    articles: NewsArticle[]
    strapiBaseUrl: string
    theme: ThemeDefinition
}

export function ArticleListWithToggle({ articles, strapiBaseUrl, theme }: ArticleListWithToggleProps) {
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
    const [readArticles, setReadArticles] = useState<Set<string>>(new Set())
    const currentYear = new Date().getFullYear()
    const [selectedYear, setSelectedYear] = useState(currentYear)

    useEffect(() => {
        getReadArticles().then(setReadArticles).catch(console.error)
    }, [])

    const filteredArticles = articles.filter((article) => {
        if (!article.DateOfPublication) return false
        const date = new Date(article.DateOfPublication)
        const year = date.getFullYear()
        return year === selectedYear || year === selectedYear - 1
    })

    // Left button: Go to Past (Decrease Year)
    const handleOlderYears = () => {
        if (selectedYear > currentYear - MAX_LOOKBACK_YEARS) {
            setSelectedYear(selectedYear - 1)
        }
    }

    // Right button: Go to Future (Increase Year)
    const handleNewerYears = () => {
        if (selectedYear < currentYear) {
            setSelectedYear(selectedYear + 1)
        }
    }



    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                        onClick={handleOlderYears}
                        disabled={selectedYear <= currentYear - MAX_LOOKBACK_YEARS}
                        aria-label="Older Years"
                        sx={{
                            color: theme.buttonColor,
                            '&.Mui-disabled': { color: theme.drawerText + '80' }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ color: theme.headlineColor, fontWeight: 'bold' }}>
                        {selectedYear - 1} / {selectedYear}
                    </Typography>
                    <IconButton
                        onClick={handleNewerYears}
                        disabled={selectedYear >= currentYear}
                        aria-label="Newer Years"
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
                <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
                    {filteredArticles.map((article) => (
                        <ArticleCard
                            key={article.documentId}
                            article={article}
                            strapiBaseUrl={strapiBaseUrl}
                        />
                    ))}
                </div>
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

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
import { IconButton, Typography, TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'

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
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    console.log('NewsArticleList rendering', { selectedYear, currentYear, articlesCount: articles.length })

    useEffect(() => {
        getReadArticles().then(setReadArticles).catch(console.error)
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchInput])

    const filteredArticles = articles.filter((article) => {
        if (!article.DateOfPublication) return false
        const date = new Date(article.DateOfPublication)
        const year = date.getFullYear()
        const yearMatch = year === selectedYear || year === selectedYear - 1

        if (!yearMatch) return false

        if (!searchQuery.trim()) return true

        const query = searchQuery.toLowerCase().trim()
        const headlineMatch = article.Headline?.toLowerCase().includes(query) ?? false
        const subheadlineMatch = article.SubHeadline?.toLowerCase().includes(query) ?? false

        return headlineMatch || subheadlineMatch
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
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 3 }}>
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

                <TextField
                    size="small"
                    placeholder="Suche in Beiträgen..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    sx={{
                        maxWidth: { sm: '300px' },
                        flexGrow: 1,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            '& fieldset': { borderColor: theme.buttonColor + '40' },
                            '&:hover fieldset': { borderColor: theme.buttonColor },
                            '&.Mui-focused fieldset': { borderColor: theme.buttonColor },
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: theme.buttonColor }} />
                            </InputAdornment>
                        ),
                    }}
                />

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

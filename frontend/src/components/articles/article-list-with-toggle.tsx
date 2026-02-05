'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { ViewToggle } from '@/components/common/view-toggle'
import type { NewsArticle } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { ArticleCard } from './article-card'
import { NewsCardListView } from '@/components/sections/news-articles-section/news-card-list-view'
import { getReadArticles } from '@/lib/client/db'

interface ArticleListWithToggleProps {
    articles: NewsArticle[]
    strapiBaseUrl: string
    theme: ThemeDefinition
}

export function ArticleListWithToggle({ articles, strapiBaseUrl, theme }: ArticleListWithToggleProps) {
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
    const [readArticles, setReadArticles] = useState<Set<string>>(new Set())

    useEffect(() => {
        getReadArticles().then(setReadArticles).catch(console.error)
    }, [])

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </Box>

            {viewMode === 'cards' ? (
                <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
                    {articles.map((article) => (
                        <ArticleCard
                            key={article.documentId}
                            article={article}
                            strapiBaseUrl={strapiBaseUrl}
                        />
                    ))}
                </div>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {articles.map((article) => (
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

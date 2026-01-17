'use client'

import { useState, useEffect } from 'react'
import { getReadArticles } from '@/lib/client/db'
import type { NewsArticle } from '@/lib/server/news-utils'
import type { ThemeDefinition } from '@/themes'
import { NewsCard } from './news-card'
import { Box } from '@mui/material'

interface NewsArticleListProps {
    articles: NewsArticle[]
    strapiBaseUrl: string
    theme: ThemeDefinition
}

export function NewsArticleList({ articles, strapiBaseUrl, theme }: NewsArticleListProps) {
    const [readArticles, setReadArticles] = useState<Set<string>>(new Set())

    useEffect(() => {
        getReadArticles().then(setReadArticles).catch(console.error)
    }, [])

    return (
        <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 4,
            width: '100%',
        }}>
            {articles.map((article) => (
                <NewsCard
                    key={article.documentId}
                    article={article}
                    strapiBaseUrl={strapiBaseUrl}
                    theme={theme}
                    isUnread={!readArticles.has(article.documentId)}
                />
            ))}
        </Box>
    )
}

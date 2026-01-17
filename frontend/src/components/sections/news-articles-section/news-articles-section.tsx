import { fetchNewsArticles } from '@/lib/server/news-utils'
import type { ThemeDefinition } from '@/themes'
import type { NewsArticlesSection } from '@/types'
import { SectionContainer } from '../section-container/section-container'
import { NewsArticleList } from './news-article-list'
import { Typography, Box } from '@mui/material'

interface NewsArticlesSectionComponentProps {
    section: NewsArticlesSection
    strapiBaseUrl: string
    theme: ThemeDefinition
}

export async function NewsArticlesSectionComponent({
    section,
    strapiBaseUrl,
    theme,
}: NewsArticlesSectionComponentProps) {
    const articles = await fetchNewsArticles({
        limit: section.MaxArticles ?? 3,
        categoryDocumentId: section.news_article_category?.documentId,
    })

    if (!articles.length) {
        return null
    }

    const backgroundColor = section.NewsArticlesAnchor && section.NewsArticlesAnchor.includes('odd') ? theme.oddBgColor : theme.evenBgColor
    // Note: We don't have an Odd/Even field in NewsArticlesSection schema but can deduce or default

    return (
        <SectionContainer
            variant='max-width'
            id={section.NewsArticlesAnchor || undefined}
            backgroundColor={backgroundColor}

            paddingTop='3em'
            paddingBottom='3em'
        >
            <Box sx={{ width: '100%' }}>
                <Typography
                    variant='h4'
                    component='h2'
                    sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        mb: 6,
                        color: theme.headlineColor
                    }}
                >
                    Aktuelles
                </Typography>

                <NewsArticleList
                    articles={articles}
                    strapiBaseUrl={strapiBaseUrl}
                    theme={theme}
                />
            </Box>
        </SectionContainer>
    )
}

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
        limit: 100, // Fetch more articles to allow client-side filtering by year
        categoryDocumentId: section.news_article_category?.documentId,
    })

    console.log('NewsArticlesSectionComponent fetched:', articles.length, 'articles')

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
                {!section.HideCategoryName && (
                    <Typography
                        variant='h4'
                        component='h1'
                        sx={{
                            textAlign: 'center',
                            fontWeight: 700,
                            mb: 2,
                            color: theme.headlineColor
                        }}
                    >
                        {section.news_article_category?.CategoryName ?? 'Aktuelles'}
                    </Typography>
                )}

                {!section.HideCategoryDescription && section.news_article_category?.CategoryDescription && (
                    <div
                        className='prose prose-xl mx-auto mb-10 max-w-[800px] text-center dark:prose-invert [&_p]:my-2'
                        style={{
                            color: theme.textColor,
                            '--tw-prose-body': theme.textColor,
                            '--tw-prose-headings': theme.headlineColor,
                        } as React.CSSProperties}
                        dangerouslySetInnerHTML={{ __html: section.news_article_category.CategoryDescription }}
                    />
                )}

                <NewsArticleList
                    articles={articles}
                    strapiBaseUrl={strapiBaseUrl}
                    theme={theme}
                />
            </Box>
        </SectionContainer>
    )
}

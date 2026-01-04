import { fetchNewsArticles } from '@/lib/server/news-utils'
import { CardSectionComponent } from '../card-section/card-section'
import type { ThemeDefinition } from '@/themes'
import type { CardItem, CardSection, NewsArticlesSection } from '@/types'

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

    // Map NewsArticle to CardItem structure for reuse
    // CardItem has: Headline, Subheadline, TeaserText, BackgroundImage, ActionButton, ColorTheme
    const cardItems: CardItem[] = articles.map((article) => ({
        id: article.documentId,
        Headline: article.Headline,
        Subheadline: formatDate(article.publishedAt), // Display date as subheadline? Or actual Subheadline?
        // Let's use Subheadline if available, else date. Or both? 
        // Card layout might not support unlimited text.
        // Let's try: Subheadline = published date. TeaserText = article teaser.
        // Or if article has subheadline, combine?
        // "dd.MM.yyyy - Subheadline"
        TeaserText: article.TeaserText,
        BackgroundImage: article.Image,
        ActionButton: article.Slug ? {
            Label: 'Mehr lesen',
            Link: `/aktuelles/${article.Slug}`, // Assuming route structure
            Primary: true
        } as any : undefined, // Type cast for ActionButton structure if needed
        // We don't have per-card color theme in news, so we leave it empty or use defaults.
        __typename: 'ComponentBlocksCardItem' as const
    }))

    // Create a synthetic CardSection object to reuse CardSectionComponent
    const syntheticCardSection: CardSection = {
        __typename: 'ComponentBlocksCardSection',
        id: `news-section-${section.id}`,
        Headline: 'Aktuelles',
        CardItem: cardItems,
        CardColumnsOddEven: 'Odd',
        CardsAnchor: section.NewsArticlesAnchor
    }

    return (
        <CardSectionComponent
            section={syntheticCardSection}
            strapiBaseUrl={strapiBaseUrl}
            theme={theme}
        />
    )
}

function formatDate(dateString?: string | null): string {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

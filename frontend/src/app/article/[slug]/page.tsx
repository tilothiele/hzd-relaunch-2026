import Image from 'next/image'
import { MainPageStructure } from '../../main-page-structure'
import { themes } from '@/themes'
import { fetchNewsArticleBySlug, fetchGlobalLayout } from '@/lib/server/fetch-news-article-by-slug'
import { renderServerSections } from '@/components/sections/server-section-factory'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import NotFoundSection from '@/components/sections/not-found-section/not-found-section'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

function ArticleHeader({
    headline,
    subHeadline,
    author,
    publishedAt,
    image,
    strapiBaseUrl
}: {
    headline?: string | null
    subHeadline?: string | null
    author?: string | null
    publishedAt?: string | null
    image?: { url: string; alternativeText?: string | null; width?: number | null; height?: number | null } | null
    strapiBaseUrl: string
}) {
    const formattedDate = publishedAt
        ? new Date(publishedAt).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
        : null

    return (
        <div className='flex w-full justify-center px-6 py-12'>
            <article className='w-full max-w-4xl'>
                {/* Article Metadata */}
                <div className='mb-8 space-y-2'>
                    {formattedDate && (
                        <time className='text-sm text-neutral-500' dateTime={publishedAt || undefined}>
                            {formattedDate}
                        </time>
                    )}
                    <h1 className='text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl'>
                        {headline}
                    </h1>
                    {subHeadline && (
                        <p className='text-xl text-neutral-600'>
                            {subHeadline}
                        </p>
                    )}
                    {author && (
                        <p className='text-sm text-neutral-500'>
                            von {author}
                        </p>
                    )}
                </div>

                {/* Article Image */}
                {image?.url && (
                    <div className='relative mb-12 aspect-video w-full overflow-hidden rounded-lg'>
                        <Image
                            src={image.url.startsWith('http') ? image.url : `${strapiBaseUrl}${image.url}`}
                            alt={image.alternativeText || headline || 'Artikelbild'}
                            fill
                            className='object-cover'
                            priority
                            unoptimized
                        />
                    </div>
                )}
            </article>
        </div>
    )
}

export default async function ArticlePage({ params }: PageProps) {
    const { slug } = await params

    if (!slug || slug.trim().length === 0) {
        // Load layout for 404 page
        const { globalLayout, baseUrl } = await fetchGlobalLayout()
        return (
            <MainPageStructure
                homepage={globalLayout}
                strapiBaseUrl={baseUrl}
                pageTitle='404 - Artikel nicht gefunden'
            >
                <NotFoundSection />
            </MainPageStructure>
        )
    }

    const slugParam = `/${slug.trim()}`
    const { article, globalLayout, baseUrl, error } = await fetchNewsArticleBySlug(slugParam)

    if (error) {
        return (
            <MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl}>
                <div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
                    <p>{error.message ?? 'Fehler beim Laden des Artikels.'}</p>
                </div>
            </MainPageStructure>
        )
    }

    if (!globalLayout) {
        return (
            <MainPageStructure homepage={null} strapiBaseUrl={baseUrl}>
                <div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
                    <p>Keine Daten verfügbar. Bitte Strapi Backend starten und Daten anlegen.</p>
                </div>
            </MainPageStructure>
        )
    }

    if (!article) {
        // Article not found - show nice 404 page with layout
        return (
            <MainPageStructure
                homepage={globalLayout}
                strapiBaseUrl={baseUrl}
                pageTitle='404 - Artikel nicht gefunden'
            >
                <NotFoundSection />
            </MainPageStructure>
        )
    }

    const sections = article.NewsContentSections || []
    const theme = themes['A'] // Default theme for articles, could be made configurable
    const renderedSections = renderServerSections({ sections, strapiBaseUrl: baseUrl, theme })

    const pageTitle = article.SEO?.MetaTitle || article.Headline || 'Artikel'

    return (
        <MainPageStructure
            homepage={globalLayout}
            theme={theme}
            strapiBaseUrl={baseUrl}
            pageTitle={pageTitle}
        >
            <SectionContainer
                variant='max-width'
                backgroundColor={theme.evenBgColor}
                paddingTop='1em'
                paddingBottom='1em'
            >
                <ArticleHeader
                    headline={article.Headline}
                    subHeadline={article.SubHeadline}
                    author={article.Author}
                    publishedAt={article.publishedAt}
                    image={article.Image}
                    strapiBaseUrl={baseUrl}
                />
                {renderedSections}
            </SectionContainer>
        </MainPageStructure>
    )
}

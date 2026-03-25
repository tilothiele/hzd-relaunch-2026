import Image from 'next/image'
import Link from 'next/link'
import { MainPageStructure } from '../../main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchAuthorBySlug } from '@/lib/server/fetch-author-by-slug'
import { fetchGraphQLServer } from '@/lib/server/graphql-client'
import { GET_NEWS_ARTICLES_BY_AUTHOR_SLUG } from '@/lib/graphql/queries'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import NotFoundSection from '@/components/sections/not-found-section/not-found-section'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

interface AuthorArticlesQueryResult {
    newsArticles?: Array<{
        documentId: string
        Headline?: string | null
        Slug?: string | null
    }> | null
}

export default async function AuthorPage({ params }: PageProps) {
    const { slug } = await params

    if (!slug || slug.trim().length === 0) {
        const { fetchGlobalLayout } = await import('@/lib/server/fetch-page-by-slug')
        const { globalLayout, baseUrl } = await fetchGlobalLayout()
        return (
            <MainPageStructure
                homepage={globalLayout}
                strapiBaseUrl={baseUrl}
                pageTitle='404 - Autor nicht gefunden'
            >
                <NotFoundSection />
            </MainPageStructure>
        )
    }

    const slugParam = slug.startsWith('/') ? slug : `/${slug.trim()}`
    const { author, globalLayout, baseUrl, error } = await fetchAuthorBySlug(slugParam)

    if (error) {
        return (
            <MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl}>
                <div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
                    <p>{error.message ?? 'Fehler beim Laden des Autors.'}</p>
                </div>
            </MainPageStructure>
        )
    }

    if (!author) {
        return (
            <MainPageStructure
                homepage={globalLayout}
                strapiBaseUrl={baseUrl}
                pageTitle='404 - Autor nicht gefunden'
            >
                <NotFoundSection />
            </MainPageStructure>
        )
    }

    const theme = globalTheme
    const displayName = author.DisplayName || [author.AcademicTitle, author.FirstName, author.LastName].filter(Boolean).join(' ') || 'Autor'
    const authorArticlesResult = await fetchGraphQLServer<AuthorArticlesQueryResult>(
        GET_NEWS_ARTICLES_BY_AUTHOR_SLUG,
        {
            baseUrl,
            variables: {
                slug: slugParam,
                pagination: { limit: 20 },
            },
        },
    )
    const authorArticles = (authorArticlesResult.newsArticles ?? []).filter(
        (article) => article.Headline && article.Slug,
    )

    return (
        <MainPageStructure
            homepage={globalLayout}
            theme={theme}
            strapiBaseUrl={baseUrl}
            pageTitle={displayName}
        >
            <SectionContainer
                variant='max-width'
                backgroundColor={theme.evenBgColor}
                paddingTop='3em'
                paddingBottom='3em'
            >
                <div className="mx-auto max-w-4xl px-4 flex flex-col items-center text-center">
                    {author.Avatar?.url ? (
                        <div className="relative mb-6 h-48 w-48 overflow-hidden rounded-full border-4 shadow-lg" style={{ borderColor: theme.buttonColor }}>
                            <Image
                                src={author.Avatar.url.startsWith('http') ? author.Avatar.url : `${baseUrl}${author.Avatar.url}`}
                                alt={author.Avatar.alternativeText || displayName}
                                fill
                                className="object-cover"
                                priority
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="mb-6 flex h-48 w-48 items-center justify-center rounded-full border-4 shadow-lg bg-gray-200" style={{ borderColor: theme.buttonColor }}>
                            <span className="text-4xl text-gray-400 font-bold tracking-widest uppercase">
                                {author.FirstName?.[0]}{author.LastName?.[0]}
                            </span>
                        </div>
                    )}

                    <h1 className="mb-2 text-4xl font-bold md:text-5xl" style={{ color: theme.headlineColor }}>
                        {displayName}
                    </h1>

                    <p className="mb-4 text-lg font-semibold" style={{ color: theme.textColor }}>
                        {author.Sex === 'Female' ? 'Autorin für die HZD' : 'Autor für die HZD'}
                    </p>

                    {author.Profession && (
                        <p className="mb-6 text-xl font-medium" style={{ color: theme.buttonColor }}>
                            {author.Profession}
                        </p>
                    )}

                    {(author.Bio || authorArticles.length > 0 || (author.ExternalPublication && author.ExternalPublication.length > 0)) && (
                        <div className="w-full max-w-3xl rounded-xl bg-white p-8 text-left shadow-md flex flex-col gap-4 mb-8">
                            {author.Bio && (
                                <>
                                    <h2 className="text-2xl font-semibold border-b pb-2" style={{ color: theme.headlineColor, borderColor: theme.buttonColor }}>
                                        Biografie
                                    </h2>
                                    <div className="prose prose-lg max-w-none text-gray-700" style={{ color: theme.textColor }} dangerouslySetInnerHTML={{ __html: author.Bio }} />
                                </>
                            )}

                            {authorArticles.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-xl font-semibold mb-3" style={{ color: theme.headlineColor }}>
                                        Beiträge von {displayName}
                                    </h3>
                                    <ul className="list-disc pl-5 space-y-2 text-left">
                                        {authorArticles.map((article) => (
                                            <li key={article.documentId}>
                                                <Link
                                                    href={`/article${article.Slug}`}
                                                    className="hover:underline font-medium"
                                                    style={{ color: theme.buttonColor }}
                                                >
                                                    {article.Headline}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {author.ExternalPublication && author.ExternalPublication.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-xl font-semibold mb-3" style={{ color: theme.headlineColor }}>
                                        Weitere Beiträge von {displayName} (extern)
                                    </h3>
                                    <ul className="list-disc pl-5 space-y-2 text-left">
                                        {author.ExternalPublication.map((pub, idx) => (
                                            pub.Link && pub.Label ? (
                                                <li key={idx}>
                                                    <a href={pub.Link} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium" style={{ color: theme.buttonColor }}>
                                                        {pub.Label}
                                                    </a>
                                                </li>
                                            ) : null
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {author.AuthorIntroduction && (
                        <div className="mb-8 max-w-2xl text-lg leading-relaxed text-gray-700 text-center" style={{ color: theme.textColor }} dangerouslySetInnerHTML={{ __html: author.AuthorIntroduction }} />
                    )}
                </div>
            </SectionContainer>
        </MainPageStructure>
    )
}

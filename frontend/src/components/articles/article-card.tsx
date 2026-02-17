import Image from 'next/image'
import Link from 'next/link'
import type { NewsArticle } from '@/types'
import { formattedDateOfPublication } from '@/lib/article-utils'
import { resolveTagColors } from '@/lib/color-utils'

import { ActionButton } from '@/components/ui/action-button'
import type { ThemeDefinition } from '@/themes'

interface ArticleCardProps {
    article: NewsArticle
    strapiBaseUrl: string
    featured?: boolean
    theme?: ThemeDefinition
}

export function ArticleCard({
    article,
    strapiBaseUrl,
    featured = false,
    theme
}: ArticleCardProps) {
    const formattedDate = formattedDateOfPublication(article)
    const pubDate = article.DateOfPublication || article.publishedAt || undefined

    const imageUrl = article.Image?.url
        ? (article.Image.url.startsWith('http') ? article.Image.url : `${strapiBaseUrl}${article.Image.url}`)
        : null

    const articleLink = `/article${article.Slug}`

    console.log(article.news_article_tags)

    return (
        <div
            className={`group block overflow-hidden rounded-lg shadow-md transition-all hover:shadow-xl ${featured ? 'md:flex md:flex-row' : ''
                }`}
            style={{ backgroundColor: theme?.cardsBackground || 'var(--color-cards-background)' }}
        >
            {imageUrl && (
                <Link href={articleLink} className={`relative block overflow-hidden aspect-[4/3] ${featured ? 'w-full md:w-1/2' : ''}`}>
                    <Image
                        src={imageUrl}
                        alt={article.Image?.alternativeText || article.Headline || 'Artikelbild'}
                        fill
                        className='object-cover transition-transform duration-300 group-hover:scale-105'
                        unoptimized
                    />
                </Link>
            )}
            <div className={`p-6 ${featured ? 'flex w-full flex-col justify-center md:w-1/2' : ''}`}>
                <div className='flex flex-wrap items-center gap-2'>
                    {formattedDate && (
                        <time className='text-sm text-gray-500' dateTime={pubDate}>
                            {formattedDate}
                        </time>
                    )}
                    {article.news_article_tags && article.news_article_tags.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                            {article.news_article_tags.map((tag) => {
                                const { color, backgroundColor } = resolveTagColors(tag)
                                return (
                                    <span
                                        key={tag.Label}
                                        className='rounded-full px-2 py-0.5 text-xs font-semibold'
                                        style={{
                                            backgroundColor,
                                            color
                                        }}
                                    >
                                        {tag.Label}
                                    </span>
                                )
                            })}
                        </div>
                    )}
                </div>
                <Link href={articleLink} className='block'>
                    <h3
                        className={`mt-2 font-bold ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}
                        style={{ color: theme?.cardsTextHeadline || 'var(--color-cards-text-headline)' }}
                    >
                        {article.Headline}
                    </h3>
                </Link>
                {article.SubHeadline && (
                    <p
                        className={`mt-2 ${featured ? 'text-lg' : 'text-base'}`}
                        style={{ color: theme?.cardsTextSubheadline || 'var(--color-cards-text-subheadline)' }}
                    >
                        {article.SubHeadline}
                    </p>
                )}
                {article.TeaserText && (
                    <p
                        className='mt-3 line-clamp-3'
                        style={{ color: theme?.cardsText || 'var(--color-cards-text)' }}
                    >
                        {article.TeaserText}
                    </p>
                )}
                <div className='mt-4'>
                    <ActionButton
                        actionButton={{
                            Label: 'Weiterlesen',
                            Link: articleLink,
                            Primary: true
                        }}
                        theme={theme}
                    />
                </div>

            </div>
        </div>
    )
}

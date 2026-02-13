import Image from 'next/image'
import Link from 'next/link'
import type { NewsArticle } from '@/types'
import { formattedDateOfPublication } from '@/lib/article-utils'

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

    return (
        <div
            className={`group block overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-xl ${featured ? 'md:flex md:flex-row' : ''
                }`}
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
                {formattedDate && (
                    <time className='text-sm text-gray-500' dateTime={pubDate}>
                        {formattedDate}
                    </time>
                )}
                <Link href={articleLink} className='block'>
                    <h3 className={`mt-2 font-bold ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                        {article.Headline}
                    </h3>
                </Link>
                {article.SubHeadline && (
                    <p className={`mt-2 ${featured ? 'text-lg' : 'text-base'}`}>
                        {article.SubHeadline}
                    </p>
                )}
                {article.TeaserText && (
                    <p className='mt-3 line-clamp-3 text-gray-600'>
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

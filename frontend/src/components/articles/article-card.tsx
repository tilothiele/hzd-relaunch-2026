import Image from 'next/image'
import Link from 'next/link'
import type { NewsArticle } from '@/types'
import { formattedDateOfPublication } from '@/lib/article-utils'

interface ArticleCardProps {
    article: NewsArticle
    strapiBaseUrl: string
    featured?: boolean
}

export function ArticleCard({
    article,
    strapiBaseUrl,
    featured = false
}: ArticleCardProps) {
    const formattedDate = formattedDateOfPublication(article)
    const pubDate = article.DateOfPublication || article.publishedAt || undefined

    const imageUrl = article.Image?.url
        ? (article.Image.url.startsWith('http') ? article.Image.url : `${strapiBaseUrl}${article.Image.url}`)
        : null

    return (
        <Link
            href={`/article${article.Slug}`}
            className={`group block overflow-hidden rounded-lg bg-white shadow-md transition-all hover:shadow-xl ${featured ? 'md:flex md:flex-row' : ''
                }`}
        >
            {imageUrl && (
                <div className={`relative overflow-hidden aspect-[4/3] ${featured ? 'w-full md:w-1/2' : ''}`}>
                    <Image
                        src={imageUrl}
                        alt={article.Image?.alternativeText || article.Headline || 'Artikelbild'}
                        fill
                        className='object-cover transition-transform duration-300 group-hover:scale-105'
                        unoptimized
                    />
                </div>
            )}
            <div className={`p-6 ${featured ? 'flex w-full flex-col justify-center md:w-1/2' : ''}`}>
                {formattedDate && (
                    <time className='text-sm text-gray-500' dateTime={pubDate}>
                        {formattedDate}
                    </time>
                )}
                <h3 className={`mt-2 font-bold text-gray-900 ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                    {article.Headline}
                </h3>
                {article.SubHeadline && (
                    <p className={`mt-2 text-gray-600 ${featured ? 'text-lg' : 'text-base'}`}>
                        {article.SubHeadline}
                    </p>
                )}
                {article.TeaserText && (
                    <p className='mt-3 line-clamp-3 text-gray-600'>
                        {article.TeaserText}
                    </p>
                )}
                <div className='mt-4 inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700'>
                    Weiterlesen
                    <svg className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                </div>
            </div>
        </Link>
    )
}

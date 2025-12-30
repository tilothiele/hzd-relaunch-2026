import { MetadataRoute } from 'next'
import { fetchGraphQLServer, getStrapiBaseUrl } from '@/lib/server/graphql-client'
import { GET_SITEMAP_DATA } from '@/lib/graphql/queries'

interface SitemapData {
    indexPage: {
        updatedAt: string
    }
    pages: {
        slug: string
        updatedAt: string
    }[]
    newsArticles: {
        Slug: string
        updatedAt: string
    }[]
    newsArticleCategories: {
        Slug: string
        updatedAt: string
    }[]
}

const noLeadingSlash = (route: string) => route.startsWith('/') ? route.slice(1) : route

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getStrapiBaseUrl()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hzd-hovawart.de' // Fallback to production URL if not set

    try {
        const data = await fetchGraphQLServer<SitemapData>(GET_SITEMAP_DATA, { baseUrl })

        const staticRoutes = [
            '',
            '/contact'
        ].map((route) => ({
            url: `${siteUrl}${route}`,
            lastModified: data?.indexPage?.updatedAt || new Date().toISOString(),
            changeFrequency: 'daily' as const,
            priority: route === '' ? 1 : 0.8,
        }))

        const dynamicPages = (data?.pages || []).map((page) => ({
            url: `${siteUrl}/${noLeadingSlash(page.slug)}`,
            lastModified: page.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

        const newsArticles = (data?.newsArticles || []).map((article) => ({
            url: `${siteUrl}/article/${noLeadingSlash(article.Slug)}`,
            lastModified: article.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }))

        const articleCategories = (data?.newsArticleCategories || []).map((category) => ({
            url: `${siteUrl}/articles/${noLeadingSlash(category.Slug)}`,
            lastModified: category.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.5,
        }))

        return [...staticRoutes, ...dynamicPages, ...newsArticles, ...articleCategories]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        // Return at least the static routes if fetch fails
        return [
            {
                url: siteUrl,
                lastModified: new Date().toISOString(),
                changeFrequency: 'daily',
                priority: 1,
            },
        ]
    }
}

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
    hzdPluginDogs: { updatedAt: string }[]
    hzdPluginBreeders: { updatedAt: string }[]
    hzdPluginLitters: { updatedAt: string }[]
    calendarEntries: { updatedAt: string }[]
}

const noLeadingSlash = (route: string) => route.startsWith('/') ? route.slice(1) : route

export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getStrapiBaseUrl()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hzd-hovawart.de'

    try {
        const data = await fetchGraphQLServer<SitemapData>(GET_SITEMAP_DATA, { baseUrl })

        const now = new Date().toISOString()
        const indexUpdated = data?.indexPage?.updatedAt || now
        const dogsUpdated = data?.hzdPluginDogs?.[0]?.updatedAt || indexUpdated
        const breedersUpdated = data?.hzdPluginBreeders?.[0]?.updatedAt || indexUpdated
        const littersUpdated = data?.hzdPluginLitters?.[0]?.updatedAt || indexUpdated
        const calendarUpdated = data?.calendarEntries?.[0]?.updatedAt || indexUpdated

        // Listing Pages with dynamic timestamps
        const listingRoutes = [
            { path: '', lastMod: indexUpdated, priority: 1, freq: 'daily' as const },
            { path: '/dogs', lastMod: dogsUpdated, priority: 0.9, freq: 'daily' as const },
            { path: '/stunt-dogs', lastMod: dogsUpdated, priority: 0.8, freq: 'weekly' as const },
            { path: '/breeders', lastMod: breedersUpdated, priority: 0.9, freq: 'daily' as const },
            { path: '/litters', lastMod: littersUpdated, priority: 0.9, freq: 'daily' as const },
            { path: '/calendar', lastMod: calendarUpdated, priority: 0.8, freq: 'daily' as const },
            { path: '/results', lastMod: calendarUpdated, priority: 0.7, freq: 'weekly' as const }, // Often tied to calendar
            { path: '/contact', lastMod: indexUpdated, priority: 0.8, freq: 'monthly' as const },
            { path: '/meine-hzd', lastMod: indexUpdated, priority: 0.6, freq: 'monthly' as const },
            { path: '/anmeldung', lastMod: indexUpdated, priority: 0.6, freq: 'monthly' as const },
        ].map((route) => ({
            url: `${siteUrl}${route.path}`,
            lastModified: route.lastMod,
            changeFrequency: route.freq,
            priority: route.priority,
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

        return [...listingRoutes, ...dynamicPages, ...newsArticles, ...articleCategories]
    } catch (error) {
        console.error('Error generating sitemap:', error)
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

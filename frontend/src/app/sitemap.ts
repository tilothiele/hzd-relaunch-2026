import { MetadataRoute } from 'next'
import { breederDetailPath } from '@/lib/breeder-display-utils'
import { dogDetailPath } from '@/lib/dog-utils'
import { getStrapiBaseUrl } from '@/lib/server/strapi-client'
import { fetchSitemapData } from '@/lib/strapi/api'

const noLeadingSlash = (route: string) => route.startsWith('/') ? route.slice(1) : route

function isPublicPage(page: {
	Restriction?: { Public?: boolean | null } | null
}) {
	if (!page.Restriction) {
		return true
	}
	return page.Restriction.Public !== false
}

function uniqueRoutes(routes: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
	const seen = new Set<string>()
	const unique: MetadataRoute.Sitemap = []
	for (const route of routes) {
		if (seen.has(route.url)) {
			continue
		}
		seen.add(route.url)
		unique.push(route)
	}
	return unique
}

export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = getStrapiBaseUrl()
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hzd-hovawart.de'

	try {
		const data = await fetchSitemapData()

		const now = new Date().toISOString()
		const indexUpdated = data?.indexPage?.updatedAt || now
		const dogsUpdated = data?.hzdPluginDogs?.[0]?.updatedAt || indexUpdated
		const breedersUpdated = data?.hzdPluginBreeders?.[0]?.updatedAt || indexUpdated
		const littersUpdated = data?.hzdPluginLitters?.[0]?.updatedAt || indexUpdated
		const calendarUpdated = data?.calendarEntries?.[0]?.updatedAt || indexUpdated

		const listingRoutes = [
			{ path: '', lastMod: indexUpdated, priority: 1, freq: 'daily' as const },
			{ path: '/contact', lastMod: indexUpdated, priority: 0.8, freq: 'monthly' as const },

			{ path: '/meine-hzd', lastMod: indexUpdated, priority: 0.6, freq: 'monthly' as const },
			{ path: '/calendar', lastMod: calendarUpdated, priority: 0.8, freq: 'daily' as const },
			{ path: '/results', lastMod: calendarUpdated, priority: 0.7, freq: 'weekly' as const },
			{ path: '/dogs', lastMod: dogsUpdated, priority: 0.9, freq: 'daily' as const },
			{ path: '/stunt-dogs', lastMod: dogsUpdated, priority: 0.8, freq: 'weekly' as const },
			{ path: '/breeders', lastMod: breedersUpdated, priority: 0.9, freq: 'daily' as const },
			{ path: '/litters', lastMod: littersUpdated, priority: 0.9, freq: 'daily' as const },
			{ path: '/anmeldung', lastMod: indexUpdated, priority: 0.6, freq: 'monthly' as const },
		].map((route) => ({
			url: `${siteUrl}${route.path}`,
			lastModified: route.lastMod,
			changeFrequency: route.freq,
			priority: route.priority,
		}))

		const dynamicPages = (data?.pages || []).flatMap((page) => {
			const slug = page.slug?.trim() ?? ''
			if (!slug || !isPublicPage(page)) {
				return []
			}
			return [{
				url: `${siteUrl}/${noLeadingSlash(slug)}`,
				lastModified: page.updatedAt || indexUpdated,
				changeFrequency: 'weekly' as const,
				priority: 0.7,
			}]
		})

		const dogs = (data?.hzdPluginDogs || []).flatMap((dog) => {
			const documentId = dog.documentId?.trim() ?? ''
			if (!documentId) {
				return []
			}
			return [{
				url: `${siteUrl}${dogDetailPath({ documentId, Slug: dog.Slug })}`,
				lastModified: dog.updatedAt || dogsUpdated,
				changeFrequency: 'weekly' as const,
				priority: 0.6,
			}]
		})

		const breeders = (data?.hzdPluginBreeders || []).flatMap((breeder) => {
			const documentId = breeder.documentId?.trim() ?? ''
			if (!documentId) {
				return []
			}
			return [{
				url: `${siteUrl}${breederDetailPath({
					documentId,
					Slug: breeder.Slug,
				})}`,
				lastModified: breeder.updatedAt || breedersUpdated,
				changeFrequency: 'weekly' as const,
				priority: 0.6,
			}]
		})

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

		return uniqueRoutes([
			...listingRoutes,
			...dynamicPages,
			...dogs,
			...breeders,
			...newsArticles,
			...articleCategories,
		])
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

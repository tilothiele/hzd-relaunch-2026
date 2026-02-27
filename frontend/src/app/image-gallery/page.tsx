
import { fetchGraphQLServer } from '@/lib/server/graphql-client'
import { GET_GALLERY_IMAGES } from '@/lib/graphql/queries'
import type { GalleryImage, GalleryImagesQueryResult } from '@/types'
import { MainPageStructure } from '../main-page-structure'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { theme as globalTheme } from '@/themes'
import { ImageGalleryView } from '@/components/image-gallery/image-gallery-view'

export const dynamic = 'force-dynamic'

export default async function ImageGalleryPage() {
    const strapiBaseUrl = process.env.STRAPI_BASE_URL || ''
    const { globalLayout, baseUrl, error: layoutError } = await fetchGlobalLayout()
    const theme = globalTheme

    let images: GalleryImage[] = []
    try {
        const result = await fetchGraphQLServer<GalleryImagesQueryResult>(GET_GALLERY_IMAGES)
        images = result.galleryImages || []
    } catch (error) {
        console.error('Error fetching gallery images:', error)
    }

    // Use the baseUrl from fetchGlobalLayout consistently
    const strapiUrl = baseUrl || strapiBaseUrl

    if (images.length === 0) {
        return (
            <MainPageStructure
                homepage={globalLayout}
                strapiBaseUrl={strapiUrl}
                theme={theme}
                pageTitle='Bildergalerie'
            >
                <div className="py-20 text-center">
                    <h1 className="text-3xl font-bold">Bildergalerie</h1>
                    <p className="mt-4 text-gray-600">Aktuell sind keine Bilder in der Galerie vorhanden.</p>
                </div>
            </MainPageStructure>
        )
    }

    // 1. Separate Featured and Non-Featured Images
    const featuredImages = images.filter(img => img.FeaturedImage === true)
    const nonFeaturedImages = images.filter(img => img.FeaturedImage !== true)

    // Hero Image: Latest Featured Image, fallback to latest non-featured
    const heroImage = featuredImages.length > 0
        ? featuredImages[0]
        : images[0]

    // 2. Group Non-Featured by Month
    type GroupedByPhotographer = {
        photographerName: string
        images: GalleryImage[]
    }

    type GroupedByMonth = {
        monthKey: string
        monthLabel: string
        photographers: GroupedByPhotographer[]
    }

    const monthGroups: GroupedByMonth[] = []

    nonFeaturedImages.forEach(img => {
        const date = new Date(img.DateOfPicture)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

        let monthGroup = monthGroups.find(g => g.monthKey === monthKey)
        if (!monthGroup) {
            monthGroup = { monthKey, monthLabel, photographers: [] }
            monthGroups.push(monthGroup)
        }

        const photographer = img.Photographer
        const photographerName = photographer
            ? `${photographer.firstName || ''} ${photographer.lastName || ''}`.trim() || photographer.username || 'Unbekannt'
            : 'Unbekannt'

        let photographerGroup = monthGroup.photographers.find(p => p.photographerName === photographerName)
        if (!photographerGroup) {
            photographerGroup = { photographerName, images: [] }
            monthGroup.photographers.push(photographerGroup)
        }

        photographerGroup.images.push(img)
    })

    monthGroups.sort((a, b) => b.monthKey.localeCompare(a.monthKey))

    return (
        <MainPageStructure
            homepage={globalLayout}
            strapiBaseUrl={strapiUrl}
            theme={theme}
            pageTitle='Bildergalerie'
        >
            <ImageGalleryView
                heroImage={heroImage}
                featuredImages={featuredImages}
                monthGroups={monthGroups}
                strapiUrl={strapiUrl}
            />
        </MainPageStructure>
    )
}

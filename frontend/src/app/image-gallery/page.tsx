
import { buildStrapiQuery } from '@/lib/strapi/filters'
import { fetchEntityList } from '@/lib/strapi/api'
import type { GalleryImage } from '@/types'
import { MainPageStructure } from '../main-page-structure'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { theme as globalTheme } from '@/themes'
import { ImageGalleryView } from '@/components/image-gallery/image-gallery-view'

export const dynamic = 'force-dynamic'

export default async function ImageGalleryPage() {
    const { globalLayout, baseUrl, error: layoutError } = await fetchGlobalLayout()
    const theme = globalTheme

    let images: GalleryImage[] = []
    try {
        const query = buildStrapiQuery({
            sort: ['DateOfSubmission:desc'],
            pagination: { pageSize: 200 },
            populate: {
                'populate[GalleryImageMedia]': 'true',
                'populate[Photographer][fields][0]': 'firstName',
                'populate[Photographer][fields][1]': 'lastName',
                'populate[Photographer][fields][2]': 'username',
            },
        })
        images = await fetchEntityList<GalleryImage>(
            'gallery-images',
            query,
            { server: true },
        )
    } catch (error) {
        console.error('Error fetching gallery images:', error)
    }

    const strapiUrl = baseUrl

    if (layoutError) {
        console.error('Layout error:', layoutError)
    }

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

    const featuredImages = images
        .filter(img => img.FeaturedImage === true)
        .sort((a, b) => b.DateOfPicture.localeCompare(a.DateOfPicture))
    const nonFeaturedImages = images.filter(img => img.FeaturedImage !== true)

    const heroImage = featuredImages.length > 0
        ? featuredImages[0]
        : images[0]

    type GroupedByYear = {
        yearKey: string
        yearLabel: string
        images: GalleryImage[]
    }

    const yearGroups: GroupedByYear[] = []

    nonFeaturedImages.forEach(img => {
        const yearKey = img.DateOfPicture.slice(0, 4)

        let yearGroup = yearGroups.find(g => g.yearKey === yearKey)
        if (!yearGroup) {
            yearGroup = { yearKey, yearLabel: yearKey, images: [] }
            yearGroups.push(yearGroup)
        }

        yearGroup.images.push(img)
    })

    yearGroups.sort((a, b) => b.yearKey.localeCompare(a.yearKey))

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
                yearGroups={yearGroups}
                strapiUrl={strapiUrl}
                headlineColor={theme.headlineColor}
                textColor={theme.textColor}
                galleryDescription={globalLayout?.GalleryDescription}
            />
        </MainPageStructure>
    )
}

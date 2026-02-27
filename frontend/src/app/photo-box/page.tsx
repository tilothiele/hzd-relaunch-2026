import { MainPageStructure } from '../main-page-structure'
import { DogSearch } from '@/components/dog-search/dog-search'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { PhotoBoxManager } from '@/components/ui/photo-box-manager'
import { AuthGuard } from '@/components/auth-guard/auth-guard'

export const dynamic = 'force-dynamic'

export default async function DogsPage() {
    const { globalLayout, baseUrl, error } = await fetchGlobalLayout()
    const theme = globalTheme

    if (error) {
        return (
            <MainPageStructure homepage={globalLayout} strapiBaseUrl={baseUrl}>
                <div className='flex min-h-[50vh] items-center justify-center px-4 text-center text-sm text-gray-600'>
                    <p>{error.message ?? 'Fehler beim Laden der Seite.'}</p>
                </div>
            </MainPageStructure>
        )
    }

    return (
        <MainPageStructure
            homepage={globalLayout}
            strapiBaseUrl={baseUrl}
            theme={theme}
            pageTitle='HZD PhotoBox'
        >
            <section className="py-12 bg-gray-50/50 min-h-[70vh]">
                <div className="container mx-auto px-4">
                    <AuthGuard
                        fallback={
                            <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                                <h2 className="text-xl font-bold mb-4 text-[#4560AA]">Zugriff eingeschränkt</h2>
                                <p className="text-gray-600 mb-6">Inhalte sind nur für angemeldete Benutzer zugänglich.</p>
                                <p className="text-[#4560AA] font-medium">
                                    Bitte über den Link oben anmelden.
                                </p>
                            </div>
                        }
                    >
                        <PhotoBoxManager
                            maxCollections={Number(process.env.STRAPI_PUBLIC_MAX_COLLECTIONS_PER_USER || 5)}
                            maxPhotosPerCollection={Number(process.env.STRAPI_PUBLIC_MAX_PHOTOS_PER_COLLECTION || 10)}
                            maxPhotoSizeMB={Number(process.env.STRAPI_PUBLIC_MAX_PHOTO_SIZE_MB || 10)}
                        />
                    </AuthGuard>
                </div>
            </section>
        </MainPageStructure>
    )
}


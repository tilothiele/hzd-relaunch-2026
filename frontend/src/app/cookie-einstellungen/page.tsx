import { MainPageStructure } from '../main-page-structure'
import { theme as globalTheme } from '@/themes'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { CookieSettings } from '@/components/cookie-settings/cookie-settings'
import { COOKIE_CONSENT } from '@/components/cookie-consent/cookie-consent-texts'

export const dynamic = 'force-dynamic'

export default async function CookieSettingsPage() {
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
            pageTitle={COOKIE_CONSENT.title}
        >
            <SectionContainer>
                <CookieSettings />
            </SectionContainer>
        </MainPageStructure>
    )
}

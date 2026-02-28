
import fs from 'fs'
import path from 'path'
import { MainPageStructure } from '../main-page-structure'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { theme as globalTheme } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { FaqView } from '@/components/faq/faq-view'

export default async function FaqPage() {
    const { globalLayout, baseUrl } = await fetchGlobalLayout()
    const theme = globalTheme

    const filePath = path.join(process.cwd(), 'src/content/faq.md')
    const fileContent = fs.readFileSync(filePath, 'utf8')

    return (
        <MainPageStructure
            homepage={globalLayout}
            strapiBaseUrl={baseUrl}
            theme={theme}
            pageTitle="FAQ"
        >
            <SectionContainer>
                <FaqView content={fileContent} theme={theme} />
            </SectionContainer>
        </MainPageStructure>
    )
}


import fs from 'fs'
import path from 'path'
import { MainPageStructure } from '../main-page-structure'
import { fetchGlobalLayout } from '@/lib/server/fetch-page-by-slug'
import { theme as globalTheme } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { ChangelogView } from '@/components/changelog/changelog-view'

export default async function ChangelogPage() {
    const { globalLayout, baseUrl } = await fetchGlobalLayout()
    const theme = globalTheme

    const filePath = path.join(process.cwd(), 'src/content/changelog.md')
    const fileContent = fs.readFileSync(filePath, 'utf8')

    return (
        <MainPageStructure
            homepage={globalLayout}
            strapiBaseUrl={baseUrl}
            theme={theme}
            pageTitle="Changelog"
        >
            <SectionContainer>
                <ChangelogView content={fileContent} theme={theme} />
            </SectionContainer>
        </MainPageStructure>
    )
}


import { fetchChampions } from '@/lib/server/champion-utils'
import type { ThemeDefinition } from '@/themes'
import type { HzdSetting, ChampionsSection } from '@/types'
import { SectionContainer } from '../section-container/section-container'
import { ChampionsList } from './champions-list'
import { getStrapiBaseUrl } from '@/lib/server/graphql-client'
import { Typography, Box } from '@mui/material'

interface ChampionsSectionComponentProps {
    section: ChampionsSection
    theme: ThemeDefinition
    hzdSetting?: HzdSetting | null
}

export async function ChampionsSectionComponent({
    section,
    theme,
    hzdSetting
}: ChampionsSectionComponentProps) {
    const champions = await fetchChampions(1, 20)

    if (!champions.length) {
        return null
    }

    return (
        <SectionContainer
            variant='max-width'
            id={section.id}
            backgroundColor={theme.evenBgColor}
            paddingTop='3em'
            paddingBottom='3em'
        >
            <Box sx={{ width: '100%' }}>
                <Typography
                    variant='h4'
                    component='h2'
                    sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        mb: 4,
                        color: theme.headlineColor
                    }}
                >
                    Unsere Champions
                </Typography>

                <ChampionsList
                    initialChampions={champions}
                    theme={theme}
                    strapiBaseUrl={getStrapiBaseUrl()}
                    hzdSetting={hzdSetting}
                />
            </Box>
        </SectionContainer>
    )
}

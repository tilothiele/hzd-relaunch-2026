import type { ThemeDefinition } from '@/themes'
import type { PassedDogsSection as PassedDogsSectionType } from '@/types'
import { SectionContainer } from '../section-container/section-container'
import { PassedDogsSectionContent } from './passed-dogs-section-content'
import { fetchApprovedPassedDogsPage } from '@/lib/server/passed-dog-utils'
import { getStrapiBaseUrl } from '@/lib/server/graphql-client'

const PAGE_SIZE = 12

interface PassedDogsSectionComponentProps {
	section: PassedDogsSectionType
	theme: ThemeDefinition
}

export async function PassedDogsSectionComponent({
	section,
	theme,
}: PassedDogsSectionComponentProps) {
	const { nodes, pageInfo } = await fetchApprovedPassedDogsPage(1, PAGE_SIZE)
	const strapiBaseUrl = getStrapiBaseUrl()

	return (
		<SectionContainer
			variant="max-width"
			id={section.id}
			backgroundColor={theme.evenBgColor}
			paddingTop="3em"
			paddingBottom="3em"
		>
			<PassedDogsSectionContent
				initialNodes={nodes}
				initialPageInfo={pageInfo}
				pageSize={PAGE_SIZE}
				strapiBaseUrl={strapiBaseUrl}
				theme={theme}
			/>
		</SectionContainer>
	)
}

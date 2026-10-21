import type { MdTextSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { FaqView } from '@/components/faq/faq-view'

interface MdTextSectionComponentProps {
	section: MdTextSection
	theme: ThemeDefinition
}

export function MdTextSectionComponent({
	section,
	theme,
}: MdTextSectionComponentProps) {
	const content = section.MarkdownText?.trim()
	if (!content) {
		return null
	}

	return (
		<SectionContainer>
			<FaqView content={content} theme={theme} />
		</SectionContainer>
	)
}

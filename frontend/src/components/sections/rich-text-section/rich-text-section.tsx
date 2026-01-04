import type { RichTextSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'

interface RichTextSectionComponentProps {
	section: RichTextSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

export function RichTextSectionComponent({
	section,
	theme,
}: RichTextSectionComponentProps) {
	if (!section.RichTextContent) {
		return null
	}

	const backgroundColor = section.RichTextOddEven === 'Odd' ? theme.oddBgColor : theme.evenBgColor

	return (
		<SectionContainer
			variant='max-width'
			id={section.RichTextAnchor || undefined}
			backgroundColor={backgroundColor}
			marginTop='1em'
			marginBottom='1em'
		>
			<div
				className='prose prose-xl max-w-none dark:prose-invert'
				dangerouslySetInnerHTML={{ __html: section.RichTextContent }}
			/>
		</SectionContainer>
	)
}


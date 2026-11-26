import type { RichTextSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import {
	SECTION_PADDING,
	sectionPaddingBottom,
	sectionPaddingTop,
} from '@/lib/section-padding'
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
	const backgroundColor = section.RichTextOddEven === 'Odd' ? theme.oddBgColor : theme.evenBgColor

	const paddingConfig = SECTION_PADDING.richText
	const paddingTop = sectionPaddingTop(paddingConfig, section.RichTextPadding?.Top)
	const paddingBottom = sectionPaddingBottom(paddingConfig, section.RichTextPadding?.Bottom)

	return (
		<SectionContainer
			variant='max-width'
			id={section.RichTextAnchor || undefined}
			backgroundColor={backgroundColor}
			paddingTop={paddingTop}
			paddingBottom={paddingBottom}
		>
			<div className="w-full max-w-[1200px]">
				{section.Title && (
					<h2 className="mb-3 text-3xl" style={{ color: theme.headlineColor }}>
						{section.Title}
					</h2>
				)}
				{section.Subtitle && (
					<h3 className="mb-4 text-2xl" style={{ color: theme.headlineColor }}>
						{section.Subtitle}
					</h3>
				)}
				{section.RichTextContent && <div
					className='rich-text-section-content prose prose-xl max-w-none dark:prose-invert [&_p]:my-2'
					style={{
						color: theme.textColor,
						'--tw-prose-body': theme.textColor,
						'--tw-prose-headings': theme.headlineColor,
					} as React.CSSProperties}
					dangerouslySetInnerHTML={{ __html: section.RichTextContent }}
				/>}
			</div>
		</SectionContainer>
	)
}


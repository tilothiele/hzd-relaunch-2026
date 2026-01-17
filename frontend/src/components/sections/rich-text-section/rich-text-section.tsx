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
				<div
					className='prose prose-xl max-w-none dark:prose-invert [&_p]:my-2'
					style={{
						color: theme.textColor,
						'--tw-prose-body': theme.textColor,
						'--tw-prose-headings': theme.headlineColor,
					} as React.CSSProperties}
					dangerouslySetInnerHTML={{ __html: section.RichTextContent }}
				/>
			</div>
		</SectionContainer>
	)
}


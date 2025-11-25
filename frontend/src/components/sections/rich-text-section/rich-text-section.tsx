import type { RichTextSection } from '@/types'
import type { ThemeDefinition } from '@/themes'

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
		<section 
			className='flex w-full justify-center px-4' 
			style={{ 
				paddingTop: '1em', 
				paddingBottom: '1em',
				backgroundColor,
			}}
		>
			<div className='w-full max-w-4xl'>
				<div
					className='prose prose-xl max-w-none dark:prose-invert'
					dangerouslySetInnerHTML={{ __html: section.RichTextContent }}
				/>
			</div>
		</section>
	)
}


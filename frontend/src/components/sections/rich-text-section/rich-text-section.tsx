'use client'

import type { RichTextSection } from '@/types'

interface RichTextSectionComponentProps {
	section: RichTextSection
	strapiBaseUrl: string
}

export function RichTextSectionComponent({
	section,
}: RichTextSectionComponentProps) {
	if (!section.RichTextContent) {
		return null
	}

	return (
		<section className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div className='w-full max-w-4xl'>
				<div
					className='prose prose-xl max-w-none dark:prose-invert'
					dangerouslySetInnerHTML={{ __html: section.RichTextContent }}
				/>
			</div>
		</section>
	)
}


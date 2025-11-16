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
		<section className='mb-16 px-4'>
			<div className='mx-auto w-full max-w-4xl'>
				<div
					className='prose prose-lg max-w-none dark:prose-invert'
					dangerouslySetInnerHTML={{ __html: section.RichTextContent }}
				/>
			</div>
		</section>
	)
}


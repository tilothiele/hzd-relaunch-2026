'use client'

import type { Dog } from '@/types'

interface DogPersonalWordsTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

export function DogPersonalWordsTab({ dog }: DogPersonalWordsTabProps) {
	const content = dog.MemosReleased

	if (!content) {
		return (
			<div className='rounded-lg bg-gray-50 p-8 text-center text-gray-500'>
				<p>Keine Angaben verfügbar.</p>
			</div>
		)
	}

	return (
		<div
			className='prose max-w-none text-gray-700'
			dangerouslySetInnerHTML={{ __html: content }}
		/>
	)
}

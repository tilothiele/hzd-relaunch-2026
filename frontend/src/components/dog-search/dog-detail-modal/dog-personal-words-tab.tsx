'use client'

import type { Dog } from '@/types'

interface DogPersonalWordsTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

export function DogPersonalWordsTab({ dog, strapiBaseUrl }: DogPersonalWordsTabProps) {
	return (
		<div className='rounded-lg bg-gray-50 p-8 text-center text-gray-500'>
			<p>Persönliche Worte werden hier angezeigt.</p>
		</div>
	)
}





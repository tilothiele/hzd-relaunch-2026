'use client'

import type { Dog } from '@/types'

interface DogImagesTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

export function DogImagesTab({ dog, strapiBaseUrl }: DogImagesTabProps) {
	return (
		<div className='rounded-lg bg-gray-50 p-8 text-center text-gray-500'>
			<p>Weitere Bilder werden hier angezeigt.</p>
		</div>
	)
}


'use client'

import type { Dog } from '@/types'

interface DogPedigreeTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

export function DogPedigreeTab({ dog, strapiBaseUrl }: DogPedigreeTabProps) {
	return (
		<div className='rounded-lg bg-gray-50 p-8 text-center text-gray-500'>
			<p>Pedigree-Informationen werden hier angezeigt.</p>
		</div>
	)
}




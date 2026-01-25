'use client'

import { Box, Typography } from '@mui/material'
import type { Dog } from '@/types'

interface DogPerformanceTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

export function DogPerformanceTab({ dog, strapiBaseUrl }: DogPerformanceTabProps) {

	const hasExhibitions = !!dog.Exhibitions
	const hasBreedSurvey = !!dog.BreedSurvey

	if (!hasExhibitions && !hasBreedSurvey) {
		return (
			<Box className='rounded-lg bg-gray-50 p-8 text-center text-gray-500'>
				<Typography>Keine Leistungsdaten verfügbar.</Typography>
			</Box>
		)
	}

	return (
		<div className='flex flex-col gap-8'>
			{hasBreedSurvey && (
				<section>
					<Typography variant='h6' gutterBottom className='text-gray-900 border-b pb-2 mb-4'>
						Körung
					</Typography>
					<div
						className='prose max-w-none text-gray-700 whitespace-pre-line'
						dangerouslySetInnerHTML={{ __html: dog.BreedSurvey! }}
					/>
				</section>
			)}

			{hasExhibitions && (
				<section>
					<Typography variant='h6' gutterBottom className='text-gray-900 border-b pb-2 mb-4'>
						Ausstellungen
					</Typography>
					<div
						className='prose max-w-none text-gray-700 whitespace-pre-line'
						dangerouslySetInnerHTML={{ __html: dog.Exhibitions! }}
					/>
				</section>
			)}
		</div>
	)
}





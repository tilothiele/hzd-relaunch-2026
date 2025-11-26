'use client'

import { Box, Typography } from '@mui/material'
import type { Dog } from '@/types'

interface DogPerformanceTabProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

export function DogPerformanceTab({ dog, strapiBaseUrl }: DogPerformanceTabProps) {
	return (
		<Box>
			<Typography variant='body1' color='text.secondary'>
				Leistungsdaten werden hier angezeigt.
			</Typography>
		</Box>
	)
}





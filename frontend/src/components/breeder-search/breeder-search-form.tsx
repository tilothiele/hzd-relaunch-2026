'use client'

import { TextField, Button, Box, Typography } from '@mui/material'
import { useState } from 'react'
import { theme } from '@/themes'

interface BreederSearchFormProps {
	nameFilter: string
	onNameFilterChange: (value: string) => void
	onSearch: () => void
	isLoading: boolean
}

export function BreederSearchForm({
	nameFilter,
	onNameFilterChange,
	onSearch,
	isLoading,
}: BreederSearchFormProps) {
	const [isHovered, setIsHovered] = useState(false)

	return (
		<Box className='mb-8 rounded-lg bg-white p-6 shadow-md'>
			<Typography variant='h5' className='mb-6 font-bold text-gray-900'>
				Züchter suchen
			</Typography>
			<Box sx={{ display: 'grid', gap: 2 }}>
				<TextField
					label='Zwingername'
					value={nameFilter}
					onChange={(e) => onNameFilterChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							onSearch()
						}
					}}
					placeholder='Zwingername'
					fullWidth
					size='small'
				/>
			</Box>
			<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
				<Button
					variant='contained'
					onClick={onSearch}
					disabled={isLoading}
					sx={{
						backgroundColor: theme.submitButtonColor,
						color: theme.submitButtonTextColor,
						filter: isHovered ? 'brightness(90%)' : 'none',
						'&:hover': {
							backgroundColor: theme.submitButtonColor,
						},
						'&:disabled': {
							backgroundColor: '#d1d5db',
							color: '#9ca3af',
						},
					}}
					onMouseEnter={() => setIsHovered(true)}
					onMouseLeave={() => setIsHovered(false)}
				>
					{isLoading ? 'Suche...' : 'Suchen'}
				</Button>
			</Box>
		</Box>
	)
}




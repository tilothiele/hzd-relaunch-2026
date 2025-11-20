'use client'

import { TextField, Button, Box, Typography } from '@mui/material'

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
						backgroundColor: '#facc15',
						color: '#565757',
						'&:hover': {
							backgroundColor: '#e6b800',
						},
						'&:disabled': {
							backgroundColor: '#d1d5db',
							color: '#9ca3af',
						},
					}}
				>
					{isLoading ? 'Suche...' : 'Suchen'}
				</Button>
			</Box>
		</Box>
	)
}




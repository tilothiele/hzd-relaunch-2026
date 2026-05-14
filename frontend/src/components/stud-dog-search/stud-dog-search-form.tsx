'use client'

import { TextField, Box, Typography } from '@mui/material'
import { SubmitButton } from '@/components/ui/submit-button'

interface StudDogSearchFormProps {
	nameFilter: string
	onNameFilterChange: (value: string) => void
	onSearch: () => void
	isLoading: boolean
}

export function StudDogSearchForm({
	nameFilter,
	onNameFilterChange,
	onSearch,
	isLoading,
}: StudDogSearchFormProps) {
	return (
		<Box className='mb-8 rounded-lg bg-white p-6 shadow-md'>
			<Typography variant='h5' className='mb-6 font-bold text-gray-900'>
				Deckrüdenbesitzer suchen
			</Typography>
			<Box sx={{ display: 'grid', gap: 2 }}>
				<TextField
					label='Name'
					value={nameFilter}
					onChange={(e) => onNameFilterChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							onSearch()
						}
					}}
					placeholder='Name des Deckrüdenbesitzers'
					fullWidth
					size='small'
				/>
			</Box>
			<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
				<SubmitButton
					label='Suchen'
					loadingLabel='Suche...'
					onClick={onSearch}
					isLoading={isLoading}
				/>
			</Box>
		</Box>
	)
}

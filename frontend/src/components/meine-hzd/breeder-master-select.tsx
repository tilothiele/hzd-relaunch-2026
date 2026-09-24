'use client'

import {
	Box,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Typography,
} from '@mui/material'
import type { Breeder } from '@/types'

interface BreederMasterSelectProps {
	breeders: Breeder[]
	value: string
	onChange: (documentId: string) => void
}

function kennelLabel (breeder: Breeder): string {
	const name = breeder.kennelName?.trim()
	return name && name.length > 0 ? name : 'Zwinger ohne Namen'
}

export function BreederMasterSelect ({
	breeders,
	value,
	onChange,
}: BreederMasterSelectProps) {
	if (breeders.length <= 1) {
		return null
	}

	return (
		<Box sx={{ mb: 3 }}>
			<FormControl fullWidth size='small'>
				<InputLabel id='breeder-master-select-label'>Zwinger</InputLabel>
				<Select
					labelId='breeder-master-select-label'
					id='breeder-master-select'
					label='Zwinger'
					value={value}
					onChange={(event) => onChange(String(event.target.value))}
				>
					<MenuItem value=''>
						<em>Bitte auswählen</em>
					</MenuItem>
					{breeders.map((breeder) => (
						<MenuItem key={breeder.documentId} value={breeder.documentId}>
							{kennelLabel(breeder)}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
				Wählen Sie den Zwinger, den Sie bearbeiten möchten.
			</Typography>
		</Box>
	)
}

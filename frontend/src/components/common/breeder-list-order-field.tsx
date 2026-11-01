'use client'

import {
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
} from '@mui/material'
import type { BreederListOrder } from '@/lib/breeder-list-order'
import { theme } from '@/themes'

interface BreederListOrderFieldProps {
	groupName: string
	order: BreederListOrder
	onOrderChange: (order: BreederListOrder) => void
}

export function BreederListOrderField({
	groupName,
	order,
	onOrderChange,
}: BreederListOrderFieldProps) {
	const labelId = `${groupName}-label`

	return (
		<FormControl component='fieldset'>
			<FormLabel
				id={labelId}
				component='legend'
				sx={{
					fontSize: '0.875rem',
					color: 'text.secondary',
					mb: 0.5,
					'&.Mui-focused': { color: 'text.secondary' },
				}}
			>
				Sortierung
			</FormLabel>
			<RadioGroup
				row
				aria-labelledby={labelId}
				name={groupName}
				value={order}
				onChange={(event) => {
					const next = event.target.value
					if (next === 'random' || next === 'zip') {
						onOrderChange(next)
					}
				}}
			>
				<FormControlLabel
					value='random'
					control={(
						<Radio
							size='small'
							sx={{
								'&.Mui-checked': {
									color: theme.submitButtonColor,
								},
							}}
						/>
					)}
					label='Zufällig'
				/>
				<FormControlLabel
					value='zip'
					control={(
						<Radio
							size='small'
							sx={{
								'&.Mui-checked': {
									color: theme.submitButtonColor,
								},
							}}
						/>
					)}
					label='Nach PLZ'
				/>
			</RadioGroup>
		</FormControl>
	)
}

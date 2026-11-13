'use client'

import { FormControl, InputLabel, MenuItem, Select, TextField, Box, Typography } from '@mui/material'
import { BreederListOrderField } from '@/components/common/breeder-list-order-field'
import { SubmitButton } from '@/components/ui/submit-button'
import type { BreederListOrder } from '@/lib/breeder-list-order'

export type BreederActiveFilter = 'active' | 'inactive' | 'all'

const BREEDER_ACTIVE_FILTER_OPTIONS: { value: BreederActiveFilter; label: string }[] = [
	{ value: 'active', label: 'Nur aktive Züchter' },
	{ value: 'inactive', label: 'Nur inaktive Züchter' },
	{ value: 'all', label: 'Aktive und inaktive Züchter' },
]

interface BreederSearchFormProps {
	nameFilter: string
	onNameFilterChange: (value: string) => void
	activeFilter: BreederActiveFilter
	onActiveFilterChange: (value: BreederActiveFilter) => void
	order: BreederListOrder
	onOrderChange: (order: BreederListOrder) => void
	onSearch: () => void
	isLoading: boolean
}

export function BreederSearchForm({
	nameFilter,
	onNameFilterChange,
	activeFilter,
	onActiveFilterChange,
	order,
	onOrderChange,
	onSearch,
	isLoading,
}: BreederSearchFormProps) {

	return (
		<Box className='mb-8 rounded-lg bg-white p-6 shadow-md'>
			<Typography variant='h5' className='mb-6 font-bold text-gray-900'>
				Züchter suchen
			</Typography>
			<Box sx={{ display: 'grid', gap: 2 }}>
				<FormControl
					size='small'
					sx={{ maxWidth: '100%' }}
				>
					<InputLabel id='breeder-active-filter-label'>Status</InputLabel>
					<Select
						labelId='breeder-active-filter-label'
						id='breeder-active-filter'
						label='Status'
						value={activeFilter}
						onChange={(e) => {
							const next = e.target.value
							if (
								next === 'active'
								|| next === 'inactive'
								|| next === 'all'
							) {
								onActiveFilterChange(next)
							}
						}}
					>
						{BREEDER_ACTIVE_FILTER_OPTIONS.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<TextField
					label='Zwinger- oder Züchtername'
					value={nameFilter}
					onChange={(e) => onNameFilterChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							onSearch()
						}
					}}
					placeholder='Zwinger- oder Züchtername'
					fullWidth
					size='small'
				/>
				<BreederListOrderField
					groupName='breeder-list-order'
					order={order}
					onOrderChange={onOrderChange}
				/>
			</Box>
			<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
				<SubmitButton
					label="Suchen"
					loadingLabel="Suche..."
					onClick={onSearch}
					isLoading={isLoading}
				/>
			</Box>
		</Box>
	)
}

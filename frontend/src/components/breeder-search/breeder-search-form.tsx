'use client'

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
		<div className='mb-8 rounded-lg bg-white p-6 shadow-md'>
			<h2 className='mb-6 text-2xl font-bold text-gray-900'>
				Züchter suchen
			</h2>
			<div className='grid gap-4 md:grid-cols-1'>
				<div>
					<label
						htmlFor='name-filter'
						className='mb-2 block text-sm font-medium text-gray-700'
					>
						Zwingername
					</label>
					<input
						id='name-filter'
						type='text'
						value={nameFilter}
						onChange={(e) => onNameFilterChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								onSearch()
							}
						}}
						placeholder='Zwingername'
						className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-yellow-400 focus:outline-none'
					/>
				</div>
			</div>
			<div className='mt-4 flex justify-end'>
				<button
					type='button'
					onClick={onSearch}
					disabled={isLoading}
					className='rounded bg-yellow-400 px-6 py-2 text-sm font-semibold text-gray-900 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
				>
					{isLoading ? 'Suche...' : 'Suchen'}
				</button>
			</div>
		</div>
	)
}


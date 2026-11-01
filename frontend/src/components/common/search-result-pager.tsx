'use client'

import { Pagination } from '@mui/material'
import { theme } from '@/themes'

export const SEARCH_PAGE_SIZES = [5, 10, 20, 50, 100] as const

export type SearchPageSize = (typeof SEARCH_PAGE_SIZES)[number]

interface SearchResultPagerProps {
	idPrefix: string
	page: number
	pageCount: number
	pageSize: SearchPageSize
	disabled?: boolean
	className?: string
	onPageChange: (page: number) => void
	onPageSizeChange: (pageSize: SearchPageSize) => void
}

const paginationSx = {
	'& .MuiPaginationItem-root': { fontSize: '0.875rem' },
	'& .MuiPaginationItem-page.Mui-selected': {
		backgroundColor: theme.submitButtonColor,
		color: theme.submitButtonTextColor,
		'&:hover': {
			backgroundColor: theme.submitButtonColor,
			filter: 'brightness(90%)',
		},
	},
	'& .MuiPaginationItem-root.Mui-disabled': { opacity: 0.5 },
}

function isSearchPageSize(value: number): value is SearchPageSize {
	return SEARCH_PAGE_SIZES.some((size) => size === value)
}

export function SearchResultPager({
	idPrefix,
	page,
	pageCount,
	pageSize,
	disabled = false,
	className = '',
	onPageChange,
	onPageSizeChange,
}: SearchResultPagerProps) {
	const selectId = `${idPrefix}-page-size`
	const safeCount = Math.max(pageCount, 1)
	const safePage = Math.min(Math.max(page, 1), safeCount)

	return (
		<div
			className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ${className}`}
		>
			<Pagination
				count={safeCount}
				page={safePage}
				onChange={(_, value) => onPageChange(value)}
				disabled={disabled || pageCount < 1}
				color='primary'
				size='small'
				showFirstButton
				showLastButton
				sx={paginationSx}
			/>
			<div className='flex items-center gap-2'>
				<label
					htmlFor={selectId}
					className='text-sm text-gray-600'
				>
					Pro Seite:
				</label>
				<select
					id={selectId}
					value={pageSize}
					disabled={disabled}
					onChange={(event) => {
						const next = Number(event.target.value)
						if (isSearchPageSize(next)) {
							onPageSizeChange(next)
						}
					}}
					className='rounded border border-gray-300 px-2 py-1 text-sm focus:border-yellow-400 focus:outline-none disabled:opacity-50'
				>
					{SEARCH_PAGE_SIZES.map((size) => (
						<option key={size} value={size}>
							{size}
						</option>
					))}
				</select>
			</div>
		</div>
	)
}

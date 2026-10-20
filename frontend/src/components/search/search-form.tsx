'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchFormProps {
	initialQuery?: string
	variant?: 'page' | 'header'
	autoFocus?: boolean
	onSubmit?: () => void
}

export function SearchForm({
	initialQuery = '',
	variant = 'page',
	autoFocus = false,
	onSubmit,
}: SearchFormProps) {
	const router = useRouter()
	const [query, setQuery] = useState(initialQuery)
	const isHeader = variant === 'header'

	useEffect(() => {
		setQuery(initialQuery)
	}, [initialQuery])

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const trimmed = query.trim()
		if (!trimmed) {
			return
		}
		router.push(`/search?q=${encodeURIComponent(trimmed)}`)
		onSubmit?.()
	}

	return (
		<form
			onSubmit={handleSubmit}
			className={
				isHeader
					? 'flex w-[min(20rem,calc(100vw-2rem))] items-center gap-2 rounded-md bg-white p-2 shadow-lg'
					: 'flex w-full flex-col gap-3 sm:flex-row sm:items-center'
			}
			role='search'
		>
			<label className='sr-only' htmlFor={isHeader ? 'header-search-query' : 'page-search-query'}>
				Suchbegriff
			</label>
			<div className={isHeader ? 'min-w-0 flex-1' : 'min-w-0 w-full flex-1'}>
				<input
					id={isHeader ? 'header-search-query' : 'page-search-query'}
					type='text'
					name='q'
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder='Suchbegriff'
					autoFocus={autoFocus}
					autoComplete='off'
					enterKeyHint='search'
					dir='ltr'
					className={
						isHeader
							? 'h-10 w-full rounded border border-gray-300 px-3 text-base text-gray-900'
							: 'h-12 w-full rounded border border-gray-300 px-4 text-base text-gray-900'
					}
				/>
			</div>
			<button
				type='submit'
				className={
					isHeader
						? 'h-10 shrink-0 rounded px-4 text-sm font-semibold'
						: 'h-12 shrink-0 rounded px-6 text-base font-semibold'
				}
				style={{
					backgroundColor: 'var(--color-action-primary)',
					color: 'var(--color-action-primary-text)',
				}}
			>
				Suchen
			</button>
		</form>
	)
}

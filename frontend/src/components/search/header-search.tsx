'use client'

import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { SearchForm } from './search-form'

interface HeaderSearchProps {
	iconColor: string
}

export function HeaderSearch({ iconColor }: HeaderSearchProps) {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!isOpen) {
			return
		}

		function handlePointerDown(event: MouseEvent) {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handlePointerDown)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('mousedown', handlePointerDown)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	return (
		<div className='relative' ref={containerRef}>
			<button
				type='button'
				title='Suche'
				aria-label='Suche öffnen'
				aria-expanded={isOpen}
				aria-controls='header-search-panel'
				className='flex items-center justify-center transition-transform hover:scale-110'
				onClick={() => setIsOpen((open) => !open)}
			>
				<FontAwesomeIcon
					icon={faMagnifyingGlass}
					className='text-[20px] md:text-[24px]'
					style={{ color: iconColor }}
				/>
			</button>
			{isOpen ? (
				<div id='header-search-panel' className='absolute right-0 top-full z-[120] mt-3'>
					<SearchForm
						variant='header'
						autoFocus
						onSubmit={() => setIsOpen(false)}
					/>
				</div>
			) : null}
		</div>
	)
}

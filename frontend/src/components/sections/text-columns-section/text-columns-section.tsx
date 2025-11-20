'use client'

import { useState, useCallback } from 'react'
import type { TextColumnsSection, BulletItem } from '@/types'

interface TextColumnsSectionComponentProps {
	section: TextColumnsSection
	strapiBaseUrl: string
}

interface BulletItemAccordionProps {
	item: BulletItem
	isOpen: boolean
	onToggle: () => void
}

function BulletItemAccordion({
	item,
	isOpen,
	onToggle,
}: BulletItemAccordionProps) {
	const headline = item.Headline
	const itemBody = item.ItemBody

	return (
		<div className='border-b border-gray-200'>
			<button
				type='button'
				onClick={onToggle}
				className='flex w-full items-center justify-between py-4 text-left transition-colors hover:text-gray-700'
				aria-expanded={isOpen}
			>
				<div className='flex items-center gap-3'>
					{headline ? (
						<span className='text-base font-medium'>{headline}</span>
					) : null}
				</div>
				<svg
					className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					fill='none'
					viewBox='0 0 24 24'
					stroke='currentColor'
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth={2}
						d='M19 9l-7 7-7-7'
					/>
				</svg>
			</button>
			{isOpen && itemBody ? (
				<div className='pb-4 pl-8'>
					<div
						className='prose prose-sm max-w-none text-gray-600'
						dangerouslySetInnerHTML={{ __html: itemBody }}
					/>
				</div>
			) : null}
		</div>
	)
}

export function TextColumnsSectionComponent({
	section,
	strapiBaseUrl,
}: TextColumnsSectionComponentProps) {
	const [openItems, setOpenItems] = useState<Set<string>>(new Set())

	const toggleItem = useCallback((itemId: string) => {
		setOpenItems((prev) => {
			const next = new Set(prev)
			if (next.has(itemId)) {
				next.delete(itemId)
			} else {
				next.add(itemId)
			}
			return next
		})
	}, [])

	const columns = section.TextColumn?.filter(
		(column): column is NonNullable<typeof column> => Boolean(column),
	) ?? []

	if (columns.length === 0) {
		return null
	}

	return (
		<section className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
			<div className='w-full max-w-6xl'>
				{section.TextColumnsHeadline ? (
					<h2 className='mb-8 text-3xl font-semibold text-gray-900'>
						{section.TextColumnsHeadline}
					</h2>
				) : null}
				{section.TextColumnsSubHeadline ? (
					<p className='mb-8 text-lg text-gray-600'>
						{section.TextColumnsSubHeadline}
					</p>
				) : null}

				<div className='grid gap-8 md:grid-cols-2'>
					{columns.map((column, columnIndex) => {
						const key = column.id ?? `column-${columnIndex}`
						const columnText = column.ColumnText
						const bulletItems = column.BulletItems?.filter(
							(item): item is BulletItem => Boolean(item),
						) ?? []

						return (
							<div key={key} className='flex flex-col gap-4'>
								{columnText ? (
									<div
										className='prose prose-lg max-w-none text-gray-700'
										dangerouslySetInnerHTML={{ __html: columnText }}
									/>
								) : null}

								{bulletItems.length > 0 ? (
									<div className='space-y-0'>
										{bulletItems.map((item, itemIndex) => {
											const itemKey = item.id ?? `${key}-item-${itemIndex}`
											const isOpen = openItems.has(itemKey)

											return (
												<BulletItemAccordion
													key={itemKey}
													item={item}
													isOpen={isOpen}
													onToggle={() => toggleItem(itemKey)}
												/>
											)
										})}
									</div>
								) : null}
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}


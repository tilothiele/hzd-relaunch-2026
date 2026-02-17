'use client'

import { useState, useCallback } from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { TextColumnsSection, BulletItem } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface TextColumnsSectionComponentProps {
	section: TextColumnsSection
	strapiBaseUrl: string
	theme: ThemeDefinition
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
		<Accordion
			expanded={isOpen}
			onChange={onToggle}
			sx={{
				boxShadow: 'none',
				backgroundColor: 'rgba(255, 255, 255, 0)',
				borderBottom: '1px solid',
				borderColor: 'divider',
				'&:before': {
					display: 'none',
				},
			}}
		>
			<AccordionSummary
				expandIcon={<ExpandMoreIcon />}
				sx={{
					mx: 1,
					mt: 1,
					py: 0,
					'& .MuiAccordionSummary-content': {
						margin: 0,
					},
				}}
			>
				{headline ? (
					<p>{headline}</p>
				) : null}
			</AccordionSummary>
			{
				itemBody ? (
					<AccordionDetails
						sx={{
							px: 4,
							pb: 2,
							'& .MuiAccordionDetails-root p': {
								color: 'text.secondary',
							},
							'& a': {
								color: 'primary.main',
								textDecoration: 'none',
								'&:hover': {
									textDecoration: 'underline',
								},
							},
						}}

					>
						<div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-2">
							<p>{itemBody}</p>
						</div>
					</AccordionDetails>
				) : null
			}
		</Accordion >
	)
}

export function TextColumnsSectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: TextColumnsSectionComponentProps) {
	const { elementRef, isVisible } = useScrollAnimation({
		threshold: 0.1,
		triggerOnce: false,
	})

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

	const backgroundColor = section.TextColumnsOddEven === 'Odd' ? theme.oddBgColor : theme.evenBgColor

	const mapPadding = (size: 'small' | 'middle' | 'large' | null | undefined) => {
		switch (size) {
			case 'small': return '1rem'
			case 'middle': return '3rem'
			case 'large': return '5rem'
			default: return '1.2rem' // Default top padding for TextColumns
		}
	}

	// Use specific defaults if not provided to match original style '1.2rem' top, '1.5rem' bottom
	const paddingTop = section.Padding?.Top ? mapPadding(section.Padding.Top) : '1.2rem'
	const paddingBottom = section.Padding?.Bottom ? mapPadding(section.Padding.Bottom) : '1.5rem'

	return (
		<SectionContainer
			variant='max-width'
			id={section.TextColumnsAnchor || undefined}
			backgroundColor={backgroundColor}
			paddingTop={paddingTop}
			paddingBottom={paddingBottom}
		>
			<div className="w-full max-w-[1200px]">
				{section.TextColumnsHeadline ? (
					<h2 className='mb-3 text-3xl' style={{ color: theme.headlineColor }}>
						{section.TextColumnsHeadline}
					</h2>
				) : null}
				{section.TextColumnsSubHeadline ? (
					<h3 className='mb-4 text-2xl' style={{ color: theme.headlineColor }}>
						{section.TextColumnsSubHeadline}
					</h3>
				) : null}

				<div
					ref={elementRef}
					className="flex w-full flex-wrap gap-10"
					style={{
						opacity: isVisible ? 1 : 0,
						transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
						transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
					}}
				>
					{columns.map((column, columnIndex) => {
						const key = column.id ?? `column-${columnIndex}`
						const columnHeadline = column.ColumnHeadline
						const columnText = column.ColumnText
						const columnActionButton = column.ColumnActionButton
						const bulletItems = column.BulletItems?.filter(
							(item): item is BulletItem => Boolean(item),
						) ?? []

						return (
							<div
								key={key}
								className="w-full md:w-[calc(50%-20px)]"
							>
								<div className="flex flex-col">
									{columnHeadline ? (
										<h5 className='mt-3 mb-2' style={{ color: theme.headlineColor }}>{columnHeadline}</h5>
									) : null}

									{columnText ? (
										<div
											className="prose max-w-none dark:prose-invert [&_p]:my-2"
											style={{
												color: theme.textColor,
												'--tw-prose-body': theme.textColor,
												'--tw-prose-headings': theme.headlineColor,
											} as React.CSSProperties}
											dangerouslySetInnerHTML={{ __html: columnText }}
										/>
									) : null}

									{bulletItems.length > 0 ? (
										<div>
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

									{columnActionButton ? (
										<div className="mt-4">
											<ActionButton actionButton={columnActionButton} theme={theme} />
										</div>
									) : null}
								</div>
							</div>
						)
					})}
				</div>
			</div>
		</SectionContainer>
	)
}


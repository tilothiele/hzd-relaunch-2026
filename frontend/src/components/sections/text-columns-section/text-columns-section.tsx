'use client'

import { useState, useCallback } from 'react'
import { Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { TextColumnsSection, BulletItem } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '@/components/sections/section-container/section-container'

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
							'& p': {
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
						<p dangerouslySetInnerHTML={{ __html: itemBody }}>
						</p>
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

	return (
		<SectionContainer
			variant='max-width'
			id={section.TextColumnsAnchor || undefined}
			backgroundColor={backgroundColor}
			marginTop='1.2rem'
			marginBottom='1.5rem'
		>
			<Box sx={{ width: '100%', maxWidth: '1200px' }}>
				{section.TextColumnsHeadline ? (
					<h2 className='mb-3 text-3xl'>
						{section.TextColumnsHeadline}
					</h2>
				) : null}
				{section.TextColumnsSubHeadline ? (
					<h3 className='mb-4 text-2xl'>
						{section.TextColumnsSubHeadline}
					</h3>
				) : null}

				<Box
					sx={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: 5,
						width: '100%',
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
							<Box
								key={key}
								sx={{
									width: { xs: '100%', md: 'calc(50% - 20px)' },
								}}
							>
								<Box sx={{ display: 'flex', flexDirection: 'column' }}>
									{columnHeadline ? (
										<h5 className='mt-3 mb-2'>{columnHeadline}</h5>
									) : null}

									{columnText ? (
										<div
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
										<Box sx={{ mt: 2 }}>
											<ActionButton actionButton={columnActionButton} theme={theme} />
										</Box>
									) : null}
								</Box>
							</Box>
						)
					})}
				</Box>
			</Box>
		</SectionContainer>
	)
}


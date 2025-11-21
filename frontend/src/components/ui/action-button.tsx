'use client'

import { Button } from '@mui/material'
import Link from 'next/link'
import type { ActionButton as ActionButtonType } from '@/types'
import type { ThemeDefinition } from '@/themes'

interface ActionButtonProps {
	actionButton: ActionButtonType
	theme?: ThemeDefinition | null
}

export function ActionButton({ actionButton, theme }: ActionButtonProps) {
	if (!actionButton?.Link || actionButton.Link.trim() === '') {
		return null
	}

	const isPrimary = actionButton.Primary === true
	const label = actionButton.Label ?? 'Mehr erfahren'

	// Theme-Farben oder Fallback
	const buttonColor = theme?.buttonColor ?? '#64574E'
	const buttonTextColor = theme?.buttonTextColor ?? '#ffffff'

	// Prüfe ob es ein interner oder externer Link ist
	const isExternalLink = actionButton.Link.startsWith('http://') || actionButton.Link.startsWith('https://')

	const commonSx = {
		borderRadius: '4px',
		px: 3,
		py: 1.5,
		fontSize: '0.875rem',
		fontWeight: 600,
		textTransform: 'uppercase' as const,
		display: 'inline-flex',
	}

	if (isPrimary) {
		// Primary Button: contained (solid)
		if (isExternalLink) {
			return (
				<Button
					component='a'
					href={actionButton.Link}
					target='_blank'
					rel='noopener noreferrer'
					variant='contained'
					sx={{
						...commonSx,
						backgroundColor: buttonColor,
						color: buttonTextColor,
						'&:hover': {
							backgroundColor: buttonColor,
							opacity: 0.9,
						},
					}}
				>
					{label}
				</Button>
			)
		}

		return (
			<Button
				component={Link}
				href={actionButton.Link}
				variant='contained'
				sx={{
					...commonSx,
					backgroundColor: buttonColor,
					color: buttonTextColor,
					'&:hover': {
						backgroundColor: buttonColor,
						opacity: 0.9,
					},
				}}
			>
				{label}
			</Button>
		)
	}

	// Secondary Button: outlined (hollow)
	if (isExternalLink) {
		return (
			<Button
				component='a'
				href={actionButton.Link}
				target='_blank'
				rel='noopener noreferrer'
				variant='outlined'
				sx={{
					...commonSx,
					borderColor: buttonColor,
					color: buttonColor,
					backgroundColor: 'transparent',
					'&:hover': {
						borderColor: buttonColor,
						backgroundColor: 'rgba(0, 0, 0, 0.04)',
					},
				}}
			>
				{label}
			</Button>
		)
	}

	return (
		<Button
			component={Link}
			href={actionButton.Link}
			variant='outlined'
			sx={{
				...commonSx,
				borderColor: buttonColor,
				color: buttonColor,
				backgroundColor: 'transparent',
				'&:hover': {
					borderColor: buttonColor,
					backgroundColor: 'rgba(0, 0, 0, 0.04)',
				},
			}}
		>
			{label}
		</Button>
	)
}


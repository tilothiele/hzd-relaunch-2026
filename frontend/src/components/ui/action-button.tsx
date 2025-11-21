'use client'

import { Button } from '@mui/material'
import type { ActionButton as ActionButtonType } from '@/types'
import type { ThemeDefinition } from '@/themes'

interface ActionButtonProps {
	actionButton: ActionButtonType
	theme?: ThemeDefinition | null
}

export function ActionButton({ actionButton, theme }: ActionButtonProps) {
	if (!actionButton.Link) {
		return null
	}

	const isPrimary = actionButton.Primary === true
	const label = actionButton.Label ?? 'Mehr erfahren'

	// Theme-Farben oder Fallback
	const buttonColor = theme?.buttonColor ?? '#64574E'
	const buttonTextColor = theme?.buttonTextColor ?? '#ffffff'

	if (isPrimary) {
		// Primary Button: contained (solid)
		return (
			<Button
				component='a'
				href={actionButton.Link}
				variant='contained'
				sx={{
					backgroundColor: buttonColor,
					color: buttonTextColor,
					borderRadius: '9999px',
					px: 3,
					py: 1.5,
					fontSize: '0.875rem',
					fontWeight: 600,
					textTransform: 'none',
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
	return (
		<Button
			component='a'
			href={actionButton.Link}
			variant='outlined'
			sx={{
				borderColor: buttonColor,
				color: buttonColor,
				borderRadius: '9999px',
				px: 3,
				py: 1.5,
				fontSize: '0.875rem',
				fontWeight: 600,
				textTransform: 'none',
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


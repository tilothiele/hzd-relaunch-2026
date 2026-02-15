
import Link from 'next/link'
import type { ActionButton as ActionButtonType } from '@/types'
import type { ThemeDefinition } from '@/themes'


interface ActionButtonProps {
	actionButton: ActionButtonType
	theme?: ThemeDefinition | null
	size?: 'small' | 'medium'
}

export function ActionButton({ actionButton, theme, size = 'medium' }: ActionButtonProps) {
	if (!actionButton?.Link || actionButton.Link.trim() === '') {
		return null
	}

	const isPrimary = actionButton.Primary === true
	const label = actionButton.Label ?? 'Mehr erfahren'

	// Theme-Farben oder Fallback
	const buttonColor = isPrimary
		? (theme?.buttonColor ?? 'var(--color-action-primary)')
		: (theme?.secondaryButtonColor ?? 'var(--color-action-secondary)')

	const buttonTextColor = isPrimary
		? (theme?.buttonTextColor ?? 'var(--color-action-primary-text)')
		: (theme?.secondaryButtonTextColor ?? 'var(--color-action-secondary-text)')

	const hoverColor = isPrimary
		? (theme?.buttonHoverColor ?? 'var(--color-action-primary-hover)')
		: (theme?.secondaryButtonHoverColor ?? 'var(--color-action-secondary-hover)')

	// Prüfe ob es ein interner oder externer Link ist
	const isExternalLink = actionButton.Link.startsWith('http://') || actionButton.Link.startsWith('https://')

	const padding = size === 'small' ? '3px 12px' : '6px 24px'
	const fontSize = size === 'small' ? '0.8rem' : '1.15rem'

	const baseStyles: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '999px',
		padding,
		fontSize,
		fontWeight: 400,
		textDecoration: 'none',
		transition: 'all 0.2s ease-in-out',
		cursor: 'pointer',
		lineHeight: 1.5
	}

	// Determine specific styles based on variant
	// Determine specific styles based on variant
	const specificStyles: React.CSSProperties = {
		backgroundColor: buttonColor,
		color: buttonTextColor,
		border: `1px solid ${buttonColor}`,
	}

	const allStyles: any = {
		...baseStyles,
		...specificStyles,
		'--button-hover-color': hoverColor,
	}

	const hoverClass = `shadow-lg hover:shadow-xl hover:!bg-[var(--button-hover-color)] hover:!border-[var(--button-hover-color)] hover:!text-white hover:!font-medium transition-all duration-200`

	console.log(hoverClass)

	if (isExternalLink) {
		return (
			<a
				href={actionButton.Link}
				target='_blank'
				rel='noopener noreferrer'
				style={allStyles}
				className={hoverClass}
			>
				{label}
			</a>
		)
	}

	return (
		<Link
			href={actionButton.Link}
			style={allStyles}
			className={hoverClass}
		>
			{label}
		</Link>
	)
}

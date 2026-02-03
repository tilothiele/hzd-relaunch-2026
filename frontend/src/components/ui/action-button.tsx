
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
	const buttonColor = theme?.buttonColor ?? 'var(--color-action-primary)'
	const buttonTextColor = theme?.buttonTextColor ?? 'var(--color-action-primary-text)'

	// Prüfe ob es ein interner oder externer Link ist
	const isExternalLink = actionButton.Link.startsWith('http://') || actionButton.Link.startsWith('https://')

	const baseStyles: React.CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '50%',
		padding: '10px 24px', // py-1.5 -> 6px, px-3 -> 12px in MUI but typically button padding is larger. Keeping user request for "standard". px-3=24px, py-1.5=12px approx.
		fontSize: '1.15rem',
		fontWeight: 400,
		textDecoration: 'none',
		transition: 'all 0.2s ease-in-out',
		cursor: 'pointer',
		lineHeight: 1.5
	}

	// Determine specific styles based on variant
	let specificStyles: React.CSSProperties = {}

	if (isPrimary) {
		specificStyles = {
			backgroundColor: buttonColor,
			color: buttonTextColor,
			border: `1px solid ${buttonColor}`,
		}
	} else {
		// Secondary / Outlined
		specificStyles = {
			backgroundColor: 'transparent',
			color: buttonColor,
			border: `1px solid ${buttonColor}`,
		}
	}

	const hoverClass = "shadow-lg hover:shadow-xl hover:!bg-[var(--color-action-primary-hover)] hover:!border-[var(--color-action-primary-hover)] hover:!text-white hover:!font-medium transition-all duration-200"

	if (isExternalLink) {
		return (
			<a
				href={actionButton.Link}
				target='_blank'
				rel='noopener noreferrer'
				style={{ ...baseStyles, ...specificStyles }}
				className={hoverClass}
			>
				{label}
			</a>
		)
	}

	return (
		<Link
			href={actionButton.Link}
			style={{ ...baseStyles, ...specificStyles }}
			className={hoverClass}
		>
			{label}
		</Link>
	)
}


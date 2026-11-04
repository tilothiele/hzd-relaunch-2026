'use client'

import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { theme } from '@/themes'

interface ExternalWebsiteLinkProps {
	href: string
	children: ReactNode
	className?: string
	style?: CSSProperties
	iconSize?: number
	stopPropagation?: boolean
}

function toExternalHref(raw: string): string {
	const trimmed = raw.trim()
	if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
		return trimmed
	}
	return `https://${trimmed}`
}

export function ExternalWebsiteLink({
	href,
	children,
	className = 'inline-flex items-center gap-1 transition-colors hover:underline',
	style,
	iconSize = 16,
	stopPropagation = false,
}: ExternalWebsiteLinkProps) {
	const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
		if (stopPropagation) {
			event.stopPropagation()
		}
	}

	return (
		<a
			href={toExternalHref(href)}
			target='_blank'
			rel='noopener noreferrer'
			className={className}
			style={{
				color: theme.submitButtonColor,
				textDecoration: 'none',
				...style,
			}}
			onClick={stopPropagation ? handleClick : undefined}
		>
			{children}
			<OpenInNewIcon sx={{ fontSize: iconSize }} aria-hidden='true' />
		</a>
	)
}

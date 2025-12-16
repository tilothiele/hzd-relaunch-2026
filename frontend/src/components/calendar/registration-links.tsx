'use client'

import Link from 'next/link'
import { Link as MuiLink } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import type { SxProps, Theme } from '@mui/material'

const linkSx = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: 0.5,
	color: 'primary.main',
	fontSize: '0.875rem',
	fontWeight: 600,
} as const

interface RegistrationLinkProps {
	href: string
	sx?: SxProps<Theme>
}

export function ExternalRegistrationLink({ href, sx }: RegistrationLinkProps) {
	return (
		<MuiLink
			href={href}
			target='_blank'
			rel='noopener noreferrer'
			underline='hover'
			sx={{ ...linkSx, ...sx }}
		>
			Anmeldung
			<OpenInNewIcon sx={{ fontSize: '0.875rem' }} />
		</MuiLink>
	)
}

export function InternalRegistrationLink({ href, sx }: RegistrationLinkProps) {
	return (
		<Link
			href={href}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: '4px',
				color: 'inherit',
				textDecoration: 'none',
			}}
		>
			<MuiLink
				component='span'
				underline='hover'
				sx={{ ...linkSx, ...sx }}
			>
				Anmeldung
			</MuiLink>
		</Link>
	)
}


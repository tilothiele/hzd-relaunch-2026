'use client'

import { Typography, Container, Box, CircularProgress } from '@mui/material'
import { useAuth } from '@/hooks/use-auth'
import { MeinHzdTabs } from './meine-hzd-tabs'

interface MeinHzdContentProps {
	strapiBaseUrl?: string | null
}

export function MeinHzdContent({ strapiBaseUrl }: MeinHzdContentProps) {
	const { isAuthenticated, isAuthenticating } = useAuth(strapiBaseUrl)

	if (isAuthenticating) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					width: '100%',
					py: 4,
				}}
			>
				<Container
					maxWidth='md'
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						minHeight: '50vh',
					}}
				>
					<CircularProgress sx={{ mb: 2 }} />
					<Typography variant='body1' color='text.secondary' sx={{ textAlign: 'center' }}>
						Lade Authentifizierungsstatus...
					</Typography>
				</Container>
			</Box>
		)
	}

	if (!isAuthenticated) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					width: '100%',
					py: 4,
				}}
			>
				<Container
					maxWidth='md'
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						minHeight: '50vh',
					}}
				>
					<Typography variant='h3' sx={{ mb: 2, textAlign: 'center' }}>
						Meine HZD
					</Typography>
					<Typography variant='body1' color='text.secondary' sx={{ textAlign: 'center' }}>
						Sie müssen angemeldet sein, um diese Seite zu sehen.
					</Typography>
				</Container>
			</Box>
		)
	}

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				width: '100%',
				py: 4,
			}}
		>
			<Container
				maxWidth='md'
				sx={{
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Typography variant='h3'>Meine HZD</Typography>
				<MeinHzdTabs />
			</Container>
		</Box>
	)
}


'use client'

import { useState } from 'react'
import {
	Box,
	CircularProgress,
	Container,
	Tab,
	Tabs,
	Typography,
} from '@mui/material'
import { useAuth } from '@/hooks/use-auth'
import { TIK_ACCESS_DENIED_MESSAGE, isTik } from '@/lib/permissions'
import { PhotoboxTab } from './photobox-tab'

interface TikPanelProps {
	strapiBaseUrl?: string | null
}

export function TikPanel({ strapiBaseUrl }: TikPanelProps) {
	const { isAuthenticating, isInitialized, user } = useAuth()
	const [activeTab, setActiveTab] = useState(0)

	if (!isInitialized || isAuthenticating) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					py: 8,
				}}
			>
				<CircularProgress />
			</Box>
		)
	}

	if (!isTik(user)) {
		return (
			<Container maxWidth='md' sx={{ py: 8 }}>
				<Typography variant='h5' component='p' role='alert'>
					{TIK_ACCESS_DENIED_MESSAGE}
				</Typography>
			</Container>
		)
	}

	return (
		<Container maxWidth='xl' sx={{ py: 4 }}>
			<Typography variant='h3' component='h1' sx={{ mb: 2 }}>
				TIK Panel
			</Typography>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs
					value={activeTab}
					onChange={(_event, value: number) => setActiveTab(value)}
					aria-label='TIK Panel'
					sx={{
						'& .MuiTab-root': {
							textTransform: 'none',
							fontSize: '0.875rem',
							fontWeight: 500,
						},
						'& .Mui-selected': {
							color: '#facc15',
						},
						'& .MuiTabs-indicator': {
							backgroundColor: '#facc15',
						},
					}}
				>
					<Tab label='Photobox' value={0} />
				</Tabs>
			</Box>
			{activeTab === 0 ? (
				<PhotoboxTab strapiBaseUrl={strapiBaseUrl} />
			) : null}
		</Container>
	)
}

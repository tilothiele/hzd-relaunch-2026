'use client'

import { useState } from 'react'
import { Tabs, Tab, Box, Typography } from '@mui/material'

type TabId = 0 | 1 | 2 | 3

export function MeinHzdTabs() {
	const [activeTab, setActiveTab] = useState<TabId>(0)

	const handleTabChange = (_event: React.SyntheticEvent, newValue: TabId) => {
		setActiveTab(newValue)
	}

	return (
		<Box sx={{ width: '100%', mt: 4 }}>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs
					value={activeTab}
					onChange={handleTabChange}
					aria-label='Mein HZD Tabs'
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
					<Tab label='Mein Profil' />
					<Tab label='Meine Würfe' />
					<Tab label='Meine Deckrüden' />
					<Tab label='Mitteilungen' />
				</Tabs>
			</Box>

			<Box sx={{ mt: 3, minHeight: '400px' }}>
				{activeTab === 0 && (
					<Box>
						<Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
							Profil-Informationen werden hier verwaltet.
						</Typography>
						<Box
							component='ul'
							sx={{
								listStyleType: 'disc',
								pl: 4,
								mb: 0,
								'& li': {
									mb: 1.5,
									fontSize: '1rem',
									color: 'text.primary',
								},
							}}
						>
							<Box component='li'>Persönliche Daten (Name, E-Mail, Telefon, Adresse)</Box>
							<Box component='li'>Passwort ändern (für den Login)</Box>
							<Box component='li'>Kontoverbindung / SEPA-Mandat (für die Zahlung)</Box>
						</Box>
					</Box>
				)}
				{activeTab === 1 && (
					<Box>
						<Typography variant='body1' color='text.secondary'>
							Würfe-Informationen werden hier verwaltet.
						</Typography>
					</Box>
				)}
				{activeTab === 2 && (
					<Box>
						<Typography variant='body1' color='text.secondary'>
							Deckrüden-Informationen werden hier verwaltet.
						</Typography>
					</Box>
				)}
				{activeTab === 3 && (
					<Box>
						<Typography variant='body1' color='text.secondary'>
							Mitteilungen werden hier verwaltet.
						</Typography>
					</Box>
				)}
			</Box>
		</Box>
	)
}


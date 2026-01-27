import { useState, useEffect } from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import { GET_BREEDER_BY_USER } from '@/lib/graphql/queries'
import { fetchGraphQL } from '@/lib/graphql-client'
import { MeinProfilTab } from './tabs/mein-profil-tab'
import { MeinZwingerTab } from './tabs/mein-zwinger-tab'
import { MeineWuerfeTab } from './tabs/meine-wuerfe-tab'
import { MeineHundeTab } from './tabs/meine-hunde-tab'
import type { AuthUser, BreederSearchResult, Breeder } from '@/types'

type TabId = 0 | 1 | 2 | 3

interface MeineHzdTabsProps {
	user: AuthUser | null
	strapiBaseUrl?: string | null
}

export function MeineHzdTabs({ user, strapiBaseUrl }: MeineHzdTabsProps) {
	const [activeTab, setActiveTab] = useState<TabId>(0)
	const [breeder, setBreeder] = useState<Breeder | null>(null)

	if (!user) {
		return null
	}

	useEffect(() => {
		async function loadBreeder() {
			if (!user?.documentId) {
				setBreeder(null)
				return
			}

			try {
				console.log('Fetching breeder for user:', user.documentId)
				const data = await fetchGraphQL<BreederSearchResult>(GET_BREEDER_BY_USER, {
					variables: { userId: user.documentId },
					baseUrl: strapiBaseUrl,
				})
				console.log('Breeder fetch result:', data)

				if (data?.hzdPluginBreeders_connection?.nodes?.length) {
					setBreeder(data.hzdPluginBreeders_connection.nodes[0])
				} else {
					setBreeder(null)
				}
			} catch (error) {
				console.error('Failed to load breeder data. Error details:', JSON.stringify(error, null, 2))
				setBreeder(null)
			}
		}

		loadBreeder()
	}, [user, strapiBaseUrl])

	useEffect(() => {
		// If active tab is Mein Zwinger (1) and user is not a breeder, switch to Profile (0)
		if (activeTab === 1 && !breeder) {
			setActiveTab(0)
		}
	}, [breeder, activeTab])

	const handleTabChange = (_event: React.SyntheticEvent, newValue: TabId) => {
		setActiveTab(newValue)
	}

	return (
		<Box sx={{ width: '100%', mt: 4 }}>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs
					value={activeTab}
					onChange={handleTabChange}
					aria-label='Meine HZD Tabs'
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
					<Tab label='Mein Profil' value={0} />
					{breeder && <Tab label='Mein Zwinger' value={1} />}
					<Tab label='Meine Würfe' value={2} />
					<Tab label='Meine Hunde' value={3} />
				</Tabs>
			</Box>

			<Box sx={{ mt: 3, minHeight: '400px' }}>
				{activeTab === 0 && <MeinProfilTab user={user} />}
				{activeTab === 1 && breeder && <MeinZwingerTab breeder={breeder} strapiBaseUrl={strapiBaseUrl} />}
				{activeTab === 2 && breeder && <MeineWuerfeTab breeder={breeder} strapiBaseUrl={strapiBaseUrl} />}
				{activeTab === 3 && <MeineHundeTab user={user} strapiBaseUrl={strapiBaseUrl} />}
			</Box>
		</Box>
	)
}

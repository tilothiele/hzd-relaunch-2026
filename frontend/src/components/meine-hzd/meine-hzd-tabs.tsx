import { useState, useEffect } from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import { searchBreeders } from '@/lib/strapi/api'
import { isBreeder, isDeckruedenbesitzer } from '@/lib/permissions'
import { MeinProfilTab } from './tabs/mein-profil-tab'
import { MeinZwingerTab } from './tabs/mein-zwinger-tab'
import { MeineWuerfeTab } from './tabs/meine-wuerfe-tab'
import { MeineHundeTab } from './tabs/meine-hunde-tab'
import type { AuthUser, Breeder } from '@/types'

type TabId = 0 | 1 | 2 | 3

interface MeineHzdTabsProps {
	user: AuthUser | null
	strapiBaseUrl?: string | null
}

export function MeineHzdTabs({ user, strapiBaseUrl }: MeineHzdTabsProps) {
	const [activeTab, setActiveTab] = useState<TabId>(0)
	const [breeder, setBreeder] = useState<Breeder | null>(null)
	const canSeeWuerfe = isBreeder(user)
	const canSeeHunde = isBreeder(user) || isDeckruedenbesitzer(user)

	useEffect(() => {
		async function loadBreeder() {
			if (!user?.documentId) {
				setBreeder(null)
				return
			}

			try {
				const data = await searchBreeders(
					{
						ownerMemberDocumentId: user.documentId,
					},
					{},
				)

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
		if (activeTab === 1 && !breeder) {
			setActiveTab(0)
			return
		}

		if (activeTab === 2 && !canSeeWuerfe) {
			setActiveTab(0)
			return
		}

		if (activeTab === 3 && !canSeeHunde) {
			setActiveTab(0)
		}
	}, [breeder, activeTab, canSeeWuerfe, canSeeHunde])

	const handleTabChange = (_event: React.SyntheticEvent, newValue: TabId) => {
		setActiveTab(newValue)
	}

	if (!user) {
		return null
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
					{canSeeWuerfe && <Tab label='Meine Würfe' value={2} />}
					{canSeeHunde && <Tab label='Meine Zuchthunde' value={3} />}
				</Tabs>
			</Box>

			<Box sx={{ mt: 3, minHeight: '400px' }}>
				{activeTab === 0 && <MeinProfilTab user={user} />}
				{activeTab === 1 && breeder && <MeinZwingerTab breeder={breeder} strapiBaseUrl={strapiBaseUrl} />}
				{activeTab === 2 && canSeeWuerfe && breeder && (
					<MeineWuerfeTab breeder={breeder} strapiBaseUrl={strapiBaseUrl} />
				)}
				{activeTab === 3 && canSeeHunde && (
					<MeineHundeTab user={user} strapiBaseUrl={strapiBaseUrl} />
				)}
			</Box>
		</Box>
	)
}

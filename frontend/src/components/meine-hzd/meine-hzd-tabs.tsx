import { useState, useEffect } from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import { searchBreeders } from '@/lib/strapi/api'
import { isDeckruedenbesitzer, isZuechter } from '@/lib/permissions'
import { MeinProfilTab } from './tabs/mein-profil-tab'
import { MeinZwingerTab } from './tabs/mein-zwinger-tab'
import { IchAlsDeckruedenbesitzerTab } from './tabs/ich-als-deckruedenbesitzer-tab'
import { MeineWuerfeTab } from './tabs/meine-wuerfe-tab'
import { MeineHundeTab } from './tabs/meine-hunde-tab'
import type { AuthUser, Breeder } from '@/types'

type TabId = 0 | 1 | 2 | 3 | 4

type BreederWithRole = Breeder & {
	BreederRole?: 'B' | 'S' | null
}

interface MeineHzdTabsProps {
	user: AuthUser | null
	strapiBaseUrl?: string | null
}

export function MeineHzdTabs({ user, strapiBaseUrl }: MeineHzdTabsProps) {
	const [activeTab, setActiveTab] = useState<TabId>(0)
	const [breeder, setBreeder] = useState<Breeder | null>(null)
	const [studBreeder, setStudBreeder] = useState<Breeder | null>(null)
	const canSeeZuechterTabs = isZuechter(user)
	const canSeeDeckruedenTab = isDeckruedenbesitzer(user)
	const canSeeHunde = canSeeZuechterTabs || canSeeDeckruedenTab
	const shouldLoadBreeder = canSeeZuechterTabs || canSeeDeckruedenTab

	useEffect(() => {
		async function loadBreeder() {
			if (!shouldLoadBreeder || !user?.documentId) {
				setBreeder(null)
				setStudBreeder(null)
				return
			}

			try {
				const data = await searchBreeders(
					{
						ownerMemberDocumentId: user.documentId,
						pageSize: 10,
					},
					{},
				)
				const nodes = data?.hzdPluginBreeders_connection?.nodes ?? []
				setBreeder(nodes[0] ?? null)
				const studOwner = nodes.find(
					(node) => (node as BreederWithRole).BreederRole === 'S',
				)
				setStudBreeder(studOwner ?? nodes[0] ?? null)
			} catch (error) {
				console.error('Failed to load breeder data. Error details:', JSON.stringify(error, null, 2))
				setBreeder(null)
				setStudBreeder(null)
			}
		}

		loadBreeder()
	}, [user, strapiBaseUrl, shouldLoadBreeder])

	useEffect(() => {
		const zwingerOrWuerfe = activeTab === 1 || activeTab === 2
		if (zwingerOrWuerfe && !canSeeZuechterTabs) {
			setActiveTab(0)
			return
		}

		if (activeTab === 1 && !breeder) {
			setActiveTab(0)
			return
		}

		if (activeTab === 3 && !canSeeHunde) {
			setActiveTab(0)
			return
		}

		if (activeTab === 4 && (!canSeeDeckruedenTab || !studBreeder)) {
			setActiveTab(0)
		}
	}, [
		breeder,
		studBreeder,
		activeTab,
		canSeeZuechterTabs,
		canSeeHunde,
		canSeeDeckruedenTab,
	])

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
					variant='scrollable'
					scrollButtons='auto'
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
					{canSeeZuechterTabs && breeder && (
						<Tab label='Mein Zwinger' value={1} />
					)}
					{canSeeZuechterTabs && <Tab label='Meine Würfe' value={2} />}
					{canSeeHunde && <Tab label='Meine Zuchthunde' value={3} />}
					{canSeeDeckruedenTab && studBreeder && (
						<Tab label='ich als Deckrüdenbesitzer' value={4} />
					)}
				</Tabs>
			</Box>

			<Box sx={{ mt: 3, minHeight: '400px' }}>
				{activeTab === 0 && <MeinProfilTab user={user} />}
				{activeTab === 1 && canSeeZuechterTabs && breeder && (
					<MeinZwingerTab breeder={breeder} strapiBaseUrl={strapiBaseUrl} />
				)}
				{activeTab === 2 && canSeeZuechterTabs && breeder && (
					<MeineWuerfeTab breeder={breeder} strapiBaseUrl={strapiBaseUrl} />
				)}
				{activeTab === 3 && canSeeHunde && (
					<MeineHundeTab user={user} strapiBaseUrl={strapiBaseUrl} />
				)}
				{activeTab === 4 && canSeeDeckruedenTab && studBreeder && (
					<IchAlsDeckruedenbesitzerTab
						breeder={studBreeder}
						strapiBaseUrl={strapiBaseUrl}
					/>
				)}
			</Box>
		</Box>
	)
}

import { useState, useEffect } from 'react'
import { Tabs, Tab, Box, CircularProgress } from '@mui/material'
import { fetchEntityByDocumentId, searchBreeders } from '@/lib/strapi/api'
import { POPULATE_BREEDER_SEARCH } from '@/lib/strapi/populate'
import { isDeckruedenbesitzer, isZuechter } from '@/lib/permissions'
import { MeinProfilTab } from './tabs/mein-profil-tab'
import { MeinZwingerTab } from './tabs/mein-zwinger-tab'
import { IchAlsDeckruedenbesitzerTab } from './tabs/ich-als-deckruedenbesitzer-tab'
import { MeineWuerfeTab } from './tabs/meine-wuerfe-tab'
import { MeineHundeTab } from './tabs/meine-hunde-tab'
import type { AuthUser, Breeder } from '@/types'

type TabId = 0 | 1 | 2 | 3 | 4

interface MeineHzdTabsProps {
	user: AuthUser | null
	strapiBaseUrl?: string | null
}

export function MeineHzdTabs({ user, strapiBaseUrl }: MeineHzdTabsProps) {
	const [activeTab, setActiveTab] = useState<TabId>(0)
	const [breeders, setBreeders] = useState<Breeder[]>([])
	const [selectedBreederId, setSelectedBreederId] = useState<string | null>(null)
	const [breedersLoading, setBreedersLoading] = useState(true)
	const [deckruedenInfo, setDeckruedenInfo] = useState<Breeder | null>(null)
	const canSeeZuechterTabs = isZuechter(user)
	const canSeeDeckruedenTab = isDeckruedenbesitzer(user)
	const canSeeHunde = canSeeZuechterTabs || canSeeDeckruedenTab
	const deckruedenInfoDocumentId = user?.deckrueden_info?.documentId ?? null

	useEffect(() => {
		async function loadBreeders() {
			if (!canSeeZuechterTabs || !user?.documentId) {
				setBreeders([])
				setSelectedBreederId(null)
				setBreedersLoading(false)
				return
			}

			setBreedersLoading(true)
			try {
				const data = await searchBreeders(
					{
						ownerMemberDocumentId: user.documentId,
						pageSize: 100,
						sort: 'kennelName:asc',
					},
					{},
				)
				const nodes = data?.hzdPluginBreeders_connection?.nodes ?? []
				setBreeders(nodes)
				setSelectedBreederId((current) => {
					if (nodes.length === 1) {
						return nodes[0].documentId
					}
					if (current && nodes.some((node) => node.documentId === current)) {
						return current
					}
					return null
				})
			} catch (error) {
				console.error('Failed to load breeder data. Error details:', JSON.stringify(error, null, 2))
				setBreeders([])
				setSelectedBreederId(null)
			} finally {
				setBreedersLoading(false)
			}
		}

		loadBreeders()
	}, [user, strapiBaseUrl, canSeeZuechterTabs])

	useEffect(() => {
		async function loadDeckruedenInfo() {
			if (!canSeeDeckruedenTab || !deckruedenInfoDocumentId) {
				setDeckruedenInfo(null)
				return
			}

			try {
				const data = await fetchEntityByDocumentId<Breeder>(
					'hzd-plugin/breeders',
					deckruedenInfoDocumentId,
					POPULATE_BREEDER_SEARCH,
				)
				setDeckruedenInfo(data)
			} catch (error) {
				console.error(
					'Failed to load deckrueden info. Error details:',
					JSON.stringify(error, null, 2),
				)
				setDeckruedenInfo(null)
			}
		}

		loadDeckruedenInfo()
	}, [canSeeDeckruedenTab, deckruedenInfoDocumentId])

	useEffect(() => {
		const zwingerOrWuerfe = activeTab === 1 || activeTab === 2
		if (zwingerOrWuerfe && !canSeeZuechterTabs) {
			setActiveTab(0)
			return
		}

		if (activeTab === 1 && !breedersLoading && breeders.length === 0) {
			setActiveTab(0)
			return
		}

		if (activeTab === 3 && !canSeeHunde) {
			setActiveTab(0)
			return
		}

		if (activeTab === 4 && (!canSeeDeckruedenTab || !deckruedenInfo)) {
			setActiveTab(0)
		}
	}, [
		breeders.length,
		breedersLoading,
		deckruedenInfo,
		activeTab,
		canSeeZuechterTabs,
		canSeeHunde,
		canSeeDeckruedenTab,
	])

	const selectedBreeder = breeders.find(
		(item) => item.documentId === selectedBreederId,
	) ?? null

	const handleTabChange = (_event: React.SyntheticEvent, newValue: TabId) => {
		setActiveTab(newValue)
	}

	const handleSelectBreeder = (documentId: string) => {
		setSelectedBreederId(documentId.length > 0 ? documentId : null)
	}

	const handleBreederUpdated = (updated: Breeder) => {
		setBreeders((current) => current.map((item) => (
			item.documentId === updated.documentId
				? { ...item, ...updated }
				: item
		)))
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
					{canSeeZuechterTabs && breeders.length > 0 && (
						<Tab label='Mein Zwinger' value={1} />
					)}
					{canSeeZuechterTabs && <Tab label='Meine Würfe' value={2} />}
					{canSeeHunde && <Tab label='Meine Zuchthunde' value={3} />}
					{canSeeDeckruedenTab && deckruedenInfo && (
						<Tab label='Deckrüdenbesitzer-Infos' value={4} />
					)}
				</Tabs>
			</Box>

			<Box sx={{ mt: 3, minHeight: '400px' }}>
				{activeTab === 0 && <MeinProfilTab user={user} />}
				{activeTab === 1 && canSeeZuechterTabs && breeders.length > 0 && (
					<MeinZwingerTab
						breeders={breeders}
						breeder={selectedBreeder}
						onSelectBreeder={handleSelectBreeder}
						onBreederUpdated={handleBreederUpdated}
						strapiBaseUrl={strapiBaseUrl}
					/>
				)}
				{activeTab === 2 && canSeeZuechterTabs && (
					breedersLoading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
							<CircularProgress />
						</Box>
					) : (
						<MeineWuerfeTab
							breeders={breeders}
							breeder={selectedBreeder}
							onSelectBreeder={handleSelectBreeder}
							strapiBaseUrl={strapiBaseUrl}
						/>
					)
				)}
				{activeTab === 3 && canSeeHunde && (
					<MeineHundeTab user={user} strapiBaseUrl={strapiBaseUrl} />
				)}
				{activeTab === 4 && canSeeDeckruedenTab && deckruedenInfo && (
					<IchAlsDeckruedenbesitzerTab
						breeder={deckruedenInfo}
						strapiBaseUrl={strapiBaseUrl}
					/>
				)}
			</Box>
		</Box>
	)
}

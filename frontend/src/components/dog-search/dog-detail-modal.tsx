'use client'

import { useEffect, useState } from 'react'
import { Tabs, Tab, Box, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import type { Dog } from '@/types'
import { DogDataTab } from './dog-detail-modal/dog-data-tab'
import { DogPedigreeTab } from './dog-detail-modal/dog-pedigree-tab'
import { DogPersonalWordsTab } from './dog-detail-modal/dog-personal-words-tab'
import { DogImagesTab } from './dog-detail-modal/dog-images-tab'
import { DogPerformanceTab } from './dog-detail-modal/dog-performance-tab'
import { DogChatTab } from './dog-detail-modal/dog-chat-tab'

interface DogDetailModalProps {
	dog: Dog | null
	strapiBaseUrl: string | null | undefined
	isOpen: boolean
	onClose: () => void
}

type TabId = 0 | 1 | 2 | 3 | 4 | 5

export function DogDetailModal({
	dog,
	strapiBaseUrl,
	isOpen,
	onClose,
}: DogDetailModalProps) {
	const [activeTab, setActiveTab] = useState<TabId>(0)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
			setActiveTab(0)
		} else {
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			window.addEventListener('keydown', handleEscape)
		}

		return () => {
			window.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen, onClose])

	if (!isOpen || !dog) {
		return null
	}

	const fullName = dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'

	const handleTabChange = (_event: React.SyntheticEvent, newValue: TabId) => {
		setActiveTab(newValue)
	}

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-end bg-black/50 p-4'
			onClick={onClose}
		>
			<div
				className='relative min-h-[600px] max-h-[90vh] min-w-[100vw] max-w-[500px] overflow-y-auto rounded-lg bg-white shadow-xl'
				style={{
					marginRight: 'min(100px, max(10vw, 0px))',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<IconButton
					onClick={onClose}
					aria-label='Schließen'
					sx={{
						position: 'absolute',
						right: 16,
						top: 16,
						zIndex: 10,
						backgroundColor: 'rgba(255, 255, 255, 0.9)',
						boxShadow: 2,
						'&:hover': {
							backgroundColor: 'white',
						},
					}}
				>
					<CloseIcon />
				</IconButton>

				{/* Content */}
				<div className='p-8'>
					{/* Header */}
					<div className='mb-6'>
						<h2 className='text-3xl font-bold text-gray-900'>{fullName}</h2>
						{dog.givenName && dog.fullKennelName ? (
							<p className='mt-2 text-lg text-gray-600'>{dog.givenName}</p>
						) : null}
					</div>

					{/* Tabs Navigation */}
					<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
						<Tabs
							value={activeTab}
							onChange={handleTabChange}
							aria-label='Hundedetails Tabs'
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
							<Tab label='Daten' />
							<Tab label='Pedigree' />
							<Tab label='Persönliche Worte' />
							<Tab label='Bilder' />
							<Tab label='Leistungen' />
							<Tab label='Chat' />
						</Tabs>
					</Box>

					{/* Tab Panels */}
					<Box sx={{ mt: 3, minHeight: '400px', height: activeTab === 5 ? '500px' : 'auto' }}>
						{activeTab === 0 && (
							<DogDataTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
						)}

						{activeTab === 1 && (
							<DogPedigreeTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
						)}

						{activeTab === 2 && (
							<DogPersonalWordsTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
						)}

						{activeTab === 3 && (
							<DogImagesTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
						)}

						{activeTab === 4 && (
							<DogPerformanceTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
						)}

						{activeTab === 5 && (
							<DogChatTab dog={dog} strapiBaseUrl={strapiBaseUrl} />
						)}
					</Box>
				</div>
			</div>
		</div>
	)
}


'use client'

import { useEffect, useState } from 'react'
import { CircularProgress, Box } from '@mui/material'
import type { ThemeDefinition } from '@/themes'
import type { PassedDogsSection } from '@/types'
import { PassedDogsSectionContent } from './passed-dogs-section-content'
import { getMoreApprovedPassedDogs } from '@/lib/server/passed-dog-actions'
import type { PassedDogCardData } from '@/lib/server/passed-dog-utils'
import { SectionContainer } from '../section-container/section-container'

const PAGE_SIZE = 12

interface PassedDogsSectionClientLoaderProps {
	section: PassedDogsSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

export function PassedDogsSectionClientLoader({
	section,
	strapiBaseUrl,
	theme,
}: PassedDogsSectionClientLoaderProps) {
	const [loading, setLoading] = useState(true)
	const [nodes, setNodes] = useState<PassedDogCardData[]>([])
	const [pageInfo, setPageInfo] = useState({
		page: 1,
		pageSize: PAGE_SIZE,
		pageCount: 0,
		total: 0,
	})

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const res = await getMoreApprovedPassedDogs(1, PAGE_SIZE)
				if (!cancelled) {
					setNodes(res.nodes)
					setPageInfo(res.pageInfo)
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		})()
		return () => {
			cancelled = true
		}
	}, [])

	return (
		<SectionContainer
			variant="max-width"
			id={section.id}
			backgroundColor={theme.evenBgColor}
			paddingTop="3em"
			paddingBottom="3em"
		>
			{loading ? (
				<Box className="flex justify-center py-16">
					<CircularProgress sx={{ color: theme.buttonColor }} />
				</Box>
			) : (
				<PassedDogsSectionContent
					initialNodes={nodes}
					initialPageInfo={pageInfo}
					pageSize={PAGE_SIZE}
					strapiBaseUrl={strapiBaseUrl}
					theme={theme}
				/>
			)}
		</SectionContainer>
	)
}

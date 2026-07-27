'use client'

import { Box, Chip } from '@mui/material'
import { resolveTagColors } from '@/lib/color-utils'

export interface NewsArticleTagBadge {
	Label?: string | null
	TagColorHexCode?: string | null
	TagBgColorHexCode?: string | null
	documentId?: string
}

interface NewsArticleTagBadgesProps {
	tags?: NewsArticleTagBadge[] | null
}

export function NewsArticleTagBadges({ tags }: NewsArticleTagBadgesProps) {
	if (!tags || tags.length === 0) {
		return null
	}

	return (
		<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
			{tags.map((tag, index) => {
				if (!tag.Label) {
					return null
				}
				const { color, backgroundColor } = resolveTagColors(tag)
				return (
					<Chip
						key={tag.documentId ?? `${tag.Label}-${index}`}
						label={tag.Label}
						size='small'
						sx={{
							backgroundColor,
							color,
							fontWeight: 600,
							fontSize: '0.75rem',
							height: 22,
							'& .MuiChip-label': {
								px: 1,
							},
						}}
					/>
				)
			})}
		</Box>
	)
}

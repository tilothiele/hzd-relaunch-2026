import type { BlackBoard, BlackBoardSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { fetchBlackBoard } from '@/lib/strapi/api'
import { BlackBoardSectionView } from './black-board-section'

interface BlackBoardSectionServerProps {
	section: BlackBoardSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

function unwrapBoard(value: unknown): BlackBoard | null {
	if (!value || typeof value !== 'object') {
		return null
	}

	const record = value as Record<string, unknown>
	if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
		return record.data as BlackBoard
	}

	return value as BlackBoard
}

export async function BlackBoardSectionServerComponent({
	section,
	strapiBaseUrl,
	theme,
}: BlackBoardSectionServerProps) {
	const populatedBoard = unwrapBoard(section.black_board)
	const documentId = populatedBoard?.documentId

	let fetchedBoard: BlackBoard | null = null
	if (documentId) {
		try {
			fetchedBoard = await fetchBlackBoard(documentId, {
				server: true,
				token: process.env.STRAPI_API_TOKEN ?? null,
			})
		} catch {
			fetchedBoard = null
		}
	}

	return (
		<BlackBoardSectionView
			board={fetchedBoard ?? populatedBoard}
			strapiBaseUrl={strapiBaseUrl}
			theme={theme}
		/>
	)
}

'use client'

import { useCallback, useMemo, useState } from 'react'
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Typography,
} from '@mui/material'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DownloadIcon from '@mui/icons-material/Download'
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer'
import type {
	BbDocument,
	BlackBoard,
	BlackBoardEntry,
	BlackBoardSection,
	File as StrapiFile,
} from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { formatDate } from '@/lib/date-utils'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface BlackBoardSectionViewProps {
	board: BlackBoard | null | undefined
	strapiBaseUrl: string
	theme: ThemeDefinition
}

interface BlackBoardSectionComponentProps {
	section: BlackBoardSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

interface BlackBoardEntryAccordionProps {
	entry: BlackBoardEntry
	entryKey: string
	isOpen: boolean
	onToggle: () => void
	strapiBaseUrl: string
	theme: ThemeDefinition
}

function unwrapRecord<T>(value: unknown): T | null {
	if (!value || typeof value !== 'object') {
		return null
	}

	const record = value as Record<string, unknown>
	if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
		return record.data as T
	}

	return value as T
}

function unwrapList<T>(value: unknown): T[] {
	if (Array.isArray(value)) {
		return value.filter((item): item is T => Boolean(item))
	}

	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>
		if (Array.isArray(record.data)) {
			return record.data.filter((item): item is T => Boolean(item))
		}
		if (Array.isArray(record.nodes)) {
			return record.nodes.filter((item): item is T => Boolean(item))
		}
	}

	return []
}

function unwrapFile(value: unknown): StrapiFile | null {
	if (!value) {
		return null
	}

	if (Array.isArray(value)) {
		return unwrapFile(value[0])
	}

	if (typeof value === 'object') {
		const record = value as Record<string, unknown>
		if (typeof record.url === 'string') {
			return record as unknown as StrapiFile
		}
		if (record.data) {
			return unwrapFile(record.data)
		}
	}

	return null
}

function publicationTimestamp(date: string | null | undefined): number {
	if (!date) {
		return 0
	}

	const time = new Date(date).getTime()
	return Number.isNaN(time) ? 0 : time
}

function compareEntriesByPublicationDesc(
	left: BlackBoardEntry,
	right: BlackBoardEntry,
): number {
	return (
		publicationTimestamp(right.BBDateOfPublication)
		- publicationTimestamp(left.BBDateOfPublication)
	)
}

function getDocuments(
	entry: BlackBoardEntry,
): Array<BbDocument & { file: StrapiFile }> {
	return unwrapList<BbDocument>(entry.BBDocument)
		.map((document) => ({
			...document,
			file: unwrapFile(document.BBFile),
		}))
		.filter(
			(document): document is BbDocument & { file: StrapiFile } => (
				Boolean(document.file?.url)
			),
		)
		.sort((left, right) => (left.Ord ?? 0) - (right.Ord ?? 0))
}

function resolveFileUrl(file: StrapiFile, strapiBaseUrl: string): string {
	if (file.url.startsWith('http')) {
		return file.url
	}

	return `${strapiBaseUrl}${file.url}`
}

function formatFileSize(bytes: number | null | undefined): string {
	if (!bytes) {
		return ''
	}

	if (bytes < 1024) {
		return `${bytes} B`
	}

	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`
	}

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function hasRenderableBlocks(content: unknown): content is BlocksContent {
	return Array.isArray(content) && content.length > 0
}

function renderRichContent(
	content: unknown,
	theme: ThemeDefinition,
) {
	if (hasRenderableBlocks(content)) {
		return (
			<div
				className="prose max-w-none dark:prose-invert [&_p]:my-2"
				style={{
					color: theme.textColor,
					'--tw-prose-body': theme.textColor,
					'--tw-prose-headings': theme.headlineColor,
				} as React.CSSProperties}
			>
				<BlocksRenderer content={content} />
			</div>
		)
	}

	if (typeof content === 'string' && content.trim()) {
		return (
			<div
				className="prose max-w-none dark:prose-invert [&_p]:my-2"
				style={{
					color: theme.textColor,
					'--tw-prose-body': theme.textColor,
					'--tw-prose-headings': theme.headlineColor,
				} as React.CSSProperties}
				dangerouslySetInnerHTML={{ __html: content }}
			/>
		)
	}

	return null
}

function BlackBoardEntryAccordion({
	entry,
	entryKey,
	isOpen,
	onToggle,
	strapiBaseUrl,
	theme,
}: BlackBoardEntryAccordionProps) {
	const documents = getDocuments(entry)
	const hasDocuments = documents.length > 0
	const publicationDate = entry.BBDateOfPublication
		? formatDate(entry.BBDateOfPublication)
		: null

	return (
		<Accordion
			expanded={isOpen}
			onChange={onToggle}
			sx={{
				boxShadow: 'none',
				backgroundColor: 'transparent',
				borderBottom: '1px solid',
				borderColor: 'divider',
				'&:before': {
					display: 'none',
				},
			}}
		>
			<AccordionSummary
				expandIcon={<ExpandMoreIcon fontSize="small" />}
				aria-controls={`${entryKey}-content`}
				id={`${entryKey}-header`}
				sx={{
					px: 1,
					py: 0,
					minHeight: 56,
					'& .MuiAccordionSummary-content': {
						margin: 0,
						alignItems: 'center',
						gap: 1.5,
						overflow: 'hidden',
					},
				}}
			>
				<Typography
					component="span"
					sx={{
						flex: 1,
						fontWeight: 500,
						color: theme.headlineColor,
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
					}}
				>
					{entry.Headline || 'Eintrag'}
				</Typography>
				{publicationDate ? (
					<Typography
						component="time"
						dateTime={entry.BBDateOfPublication ?? undefined}
						sx={{
							color: theme.textColor,
							flexShrink: 0,
							fontSize: '0.875rem',
							opacity: 0.75,
							whiteSpace: 'nowrap',
						}}
					>
						{publicationDate}
					</Typography>
				) : null}
				{hasDocuments ? (
					<AttachFileIcon
						fontSize="small"
						titleAccess="Dokumente vorhanden"
						sx={{
							color: theme.buttonColor,
							flexShrink: 0,
						}}
					/>
				) : null}
			</AccordionSummary>
			<AccordionDetails
				id={`${entryKey}-content`}
				sx={{
					px: 2,
					pb: 2,
					pt: 0,
					'& a': {
						color: 'primary.main',
						textDecoration: 'none',
						'&:hover': {
							textDecoration: 'underline',
						},
					},
				}}
			>
				{entry.TeaserText ? (
					<p
						className="mb-3 whitespace-pre-wrap"
						style={{ color: theme.textColor }}
					>
						{entry.TeaserText}
					</p>
				) : null}

				{renderRichContent(entry.BBMessage, theme)}

				{hasDocuments ? (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
							mt: entry.TeaserText || entry.BBMessage ? 2 : 0,
						}}
					>
						{documents.map((document, index) => {
							const file = document.file
							const fileUrl = resolveFileUrl(file, strapiBaseUrl)
							const label = document.Description || file.name || 'Download'
							const metaParts = [
								file.ext?.replace('.', '').toUpperCase(),
								formatFileSize(file.size),
							].filter(Boolean)

							return (
								<Box
									key={document.id ?? `${entryKey}-doc-${index}`}
									sx={{
										alignItems: 'center',
										display: 'flex',
										flexWrap: 'wrap',
										gap: 1,
										justifyContent: 'space-between',
									}}
								>
									<Typography
										variant="body2"
										sx={{ color: theme.textColor }}
									>
										{label}
										{metaParts.length > 0 ? (
											<Typography
												component="span"
												variant="caption"
												sx={{
													color: 'text.secondary',
													ml: 1,
												}}
											>
												{metaParts.join(' • ')}
											</Typography>
										) : null}
									</Typography>
									<Button
										component="a"
										href={fileUrl}
										target="_blank"
										rel="noopener noreferrer"
										variant="outlined"
										size="small"
										startIcon={<DownloadIcon />}
										sx={{ textTransform: 'none' }}
									>
										Download
									</Button>
								</Box>
							)
						})}
					</Box>
				) : null}
			</AccordionDetails>
		</Accordion>
	)
}

export function BlackBoardSectionView({
	board,
	strapiBaseUrl,
	theme,
}: BlackBoardSectionViewProps) {
	const { elementRef, isVisible } = useScrollAnimation({
		threshold: 0.1,
		triggerOnce: false,
	})
	const [openItems, setOpenItems] = useState<Set<string>>(new Set())

	const resolvedBoard = unwrapRecord<BlackBoard>(board)

	const entries = useMemo(() => {
		return unwrapList<BlackBoardEntry>(resolvedBoard?.BlackBoardEntry)
			.slice()
			.sort(compareEntriesByPublicationDesc)
	}, [resolvedBoard?.BlackBoardEntry])

	const toggleItem = useCallback((itemId: string) => {
		setOpenItems((prev) => {
			const next = new Set(prev)
			if (next.has(itemId)) {
				next.delete(itemId)
			} else {
				next.add(itemId)
			}
			return next
		})
	}, [])

	if (!resolvedBoard) {
		return null
	}

	if (!resolvedBoard.BBHeadline && !resolvedBoard.BBDescription && entries.length === 0) {
		return null
	}

	return (
		<SectionContainer
			variant="max-width"
			backgroundColor={theme.evenBgColor}
			paddingTop="2em"
			paddingBottom="2em"
		>
			<div
				ref={elementRef}
				className="w-full max-w-[1200px]"
				style={{
					opacity: isVisible ? 1 : 0,
					transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
					transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
				}}
			>
				{resolvedBoard.BBHeadline ? (
					<h2
						className="mb-3 text-3xl"
						style={{ color: theme.headlineColor }}
					>
						{resolvedBoard.BBHeadline}
					</h2>
				) : null}

				{resolvedBoard.BBDescription ? (
					<div className="mb-4">
						{renderRichContent(resolvedBoard.BBDescription, theme)}
					</div>
				) : null}

				{entries.length > 0 ? (
					<div>
						{entries.map((entry, index) => {
							const entryKey = String(
								entry.id ?? `blackboard-${index}`,
							)
							return (
								<BlackBoardEntryAccordion
									key={entryKey}
									entry={entry}
									entryKey={entryKey}
									isOpen={openItems.has(entryKey)}
									onToggle={() => toggleItem(entryKey)}
									strapiBaseUrl={strapiBaseUrl}
									theme={theme}
								/>
							)
						})}
					</div>
				) : null}
			</div>
		</SectionContainer>
	)
}

export function BlackBoardSectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: BlackBoardSectionComponentProps) {
	return (
		<BlackBoardSectionView
			board={section.black_board}
			strapiBaseUrl={strapiBaseUrl}
			theme={theme}
		/>
	)
}

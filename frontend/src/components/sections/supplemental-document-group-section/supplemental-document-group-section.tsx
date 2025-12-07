import { Container, Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import type { SupplementalDocumentGroupSection, SupplementalDocument } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'

// Strapi Blocks Format Types
interface StrapiBlock {
	type: string
	children?: StrapiBlock[]
	text?: string
	bold?: boolean
	italic?: boolean
	underline?: boolean
	code?: boolean
	url?: string
}

/**
 * Konvertiert Strapi Blocks JSON zu HTML
 */
function renderStrapiBlocks(blocks: unknown): string {
	if (!blocks) {
		return ''
	}

	// Wenn es bereits ein String ist, zurückgeben
	if (typeof blocks === 'string') {
		return blocks
	}

	// Wenn es ein Array ist, verarbeite es als Blocks
	if (Array.isArray(blocks)) {
		return blocks.map((block) => renderBlock(block)).join('')
	}

	// Wenn es ein Objekt ist, versuche es als Block zu behandeln
	if (typeof blocks === 'object' && blocks !== null) {
		return renderBlock(blocks as StrapiBlock)
	}

	return ''
}

function renderBlock(block: StrapiBlock): string {
	if (!block || typeof block !== 'object') {
		return ''
	}

	const { type, children, text, bold, italic, underline, code, url } = block

	// Text-Node
	if (type === 'text' || text !== undefined) {
		let content = text || ''
		if (bold) content = `<strong>${content}</strong>`
		if (italic) content = `<em>${content}</em>`
		if (underline) content = `<u>${content}</u>`
		if (code) content = `<code>${content}</code>`
		return content
	}

	// Link
	if (type === 'link' && url) {
		const linkContent = children ? children.map(renderBlock).join('') : ''
		return `<a href="${url}">${linkContent}</a>`
	}

	// Paragraph
	if (type === 'paragraph') {
		const content = children ? children.map(renderBlock).join('') : ''
		return `<p>${content}</p>`
	}

	// Heading
	if (type === 'heading') {
		const level = (block as { level?: number }).level || 1
		const content = children ? children.map(renderBlock).join('') : ''
		return `<h${level}>${content}</h${level}>`
	}

	// List
	if (type === 'list') {
		const listType = (block as { format?: string }).format === 'ordered' ? 'ol' : 'ul'
		const content = children ? children.map((child) => `<li>${renderBlock(child)}</li>`).join('') : ''
		return `<${listType}>${content}</${listType}>`
	}

	// List Item
	if (type === 'list-item') {
		const content = children ? children.map(renderBlock).join('') : ''
		return content
	}

	// Quote
	if (type === 'quote') {
		const content = children ? children.map(renderBlock).join('') : ''
		return `<blockquote>${content}</blockquote>`
	}

	// Code
	if (type === 'code') {
		const content = children ? children.map(renderBlock).join('') : ''
		return `<pre><code>${content}</code></pre>`
	}

	// Generic: Rendere Children falls vorhanden
	if (children && Array.isArray(children)) {
		return children.map(renderBlock).join('')
	}

	return ''
}

interface SupplementalDocumentGroupSectionComponentProps {
	section: SupplementalDocumentGroupSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

function isDocumentVisible(document: SupplementalDocument | null | undefined): boolean {
	if (!document) {
		return false
	}

	const now = new Date()
	const visibilityStart = document.VisibilityStart ? new Date(document.VisibilityStart) : null
	const visibilityEnd = document.VisibilityEnd ? new Date(document.VisibilityEnd) : null

	if (visibilityStart && now < visibilityStart) {
		return false
	}

	if (visibilityEnd && now > visibilityEnd) {
		return false
	}

	return true
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

function getVisibleDocuments(documentGroup: SupplementalDocumentGroupSection['supplemental_document_group']): SupplementalDocument[] {
	if (!documentGroup?.supplemental_documents) {
		return []
	}

	return documentGroup.supplemental_documents
		.filter(isDocumentVisible)
		.sort((a, b) => {
			// Sortiere primär nach SortOrd, dann nach Name
			const aSortOrd = a.SortOrd ?? Number.MAX_SAFE_INTEGER
			const bSortOrd = b.SortOrd ?? Number.MAX_SAFE_INTEGER

			if (aSortOrd !== bSortOrd) {
				return aSortOrd - bSortOrd
			}

			// Falls SortOrd gleich oder nicht vorhanden, sortiere nach Name
			if (!a.Name || !b.Name) {
				return 0
			}
			return a.Name.localeCompare(b.Name, 'de')
		})
}

export function SupplementalDocumentGroupSectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: SupplementalDocumentGroupSectionComponentProps) {
	const documentGroup = section.supplemental_document_group
	const visibleDocuments = getVisibleDocuments(documentGroup)

	if (!documentGroup || visibleDocuments.length === 0) {
		return null
	}

	const groupName = documentGroup.Name || section.GroupHeadline || 'Dokumente'
	const backgroundColor = section.SupplementalsOddEven === 'Odd' ? theme.oddBgColor : theme.evenBgColor

	return (
		<SectionContainer
			variant='max-width'
			backgroundColor={backgroundColor}
			paddingTop='2em'
			paddingBottom='2em'
		>
			<Container maxWidth='md'>
				{section.GroupHeadline ? (
					<Typography
						variant='h3'
						component='h3'
						sx={{
							mb: 3,
							fontWeight: 700,
							color: 'text.primary',
						}}
					>
						{section.GroupHeadline}
					</Typography>
				) : null}
				{groupName && !section.GroupHeadline ? (
					<Typography
						variant='h3'
						component='h3'
						sx={{
							mb: 3,
							fontWeight: 700,
							color: 'text.primary',
						}}
					>
						{groupName}
					</Typography>
				) : null}

				<TableContainer component={Paper} sx={{ boxShadow: 2 }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
								<TableCell sx={{ fontWeight: 600 }} align='right'>Download</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{visibleDocuments.flatMap((document) => {
								const documents = document.DownloadDocument || []
								const documentId = document.documentId || document.Name || 'unknown'

								// Parse Description (kann String oder JSON-Objekt sein)
								let descriptionHtml = ''
								let hasDescription = false

								if (document.Description) {
									if (typeof document.Description === 'string') {
										// Versuche, es als JSON zu parsen (falls es ein JSON-String ist)
										try {
											const parsed = JSON.parse(document.Description)
											descriptionHtml = renderStrapiBlocks(parsed)
										} catch {
											// Wenn Parsing fehlschlägt, ist es bereits HTML
											descriptionHtml = document.Description
										}
									} else if (typeof document.Description === 'object') {
										// Es ist bereits ein JSON-Objekt
										descriptionHtml = renderStrapiBlocks(document.Description)
									}

									// Prüfe, ob nach Rendering noch Inhalt vorhanden ist
									hasDescription = descriptionHtml.replace(/<[^>]*>/g, '').trim().length > 0
								}

								const rows = [
									<TableRow
										key={documentId}
										sx={{
											'&:hover': {
												backgroundColor: 'action.hover',
											},
											...(hasDescription && {
												'& td': {
													borderBottom: 'none',
												},
											}),
										}}
									>
										<TableCell>
											{document.ShortId ? (
												<Chip
													label={document.ShortId}
													size='small'
													sx={{
														fontSize: '0.75rem',
													}}
												/>
											) : (
												<Typography variant='body2' color='text.secondary'>
													-
												</Typography>
											)}
										</TableCell>
										<TableCell>
											{document.Name ? (
												<Typography variant='body1' sx={{ fontWeight: 600 }}>
													{document.Name}
												</Typography>
											) : (
												<Typography variant='body2' color='text.secondary'>
													-
												</Typography>
											)}
										</TableCell>
										<TableCell align='right'>
											<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
												{documents.length > 0 ? (
													documents.map((file, fileIndex) => {
														const fileUrl = file.url.startsWith('http')
															? file.url
															: `${strapiBaseUrl}${file.url}`

														return (
															<Box key={fileIndex} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
																<Button
																	component='a'
																	href={fileUrl}
																	download
																	variant='contained'
																	size='small'
																	startIcon={<DownloadIcon />}
																	sx={{
																		backgroundColor: '#facc15',
																		color: 'text.primary',
																		fontWeight: 600,
																		'&:hover': {
																			backgroundColor: '#eab308',
																		},
																	}}
																>
																	Download
																</Button>
																{(file.name || file.size) && (
																	<Typography
																		variant='caption'
																		sx={{
																			mt: 0.5,
																			color: 'text.secondary',
																			fontSize: '0.75rem',
																		}}
																	>
																		{file.name && file.name}
																		{file.name && file.size && ' • '}
																		{file.size && formatFileSize(file.size)}
																	</Typography>
																)}
															</Box>
														)
													})
												) : (
													<Typography variant='body2' color='text.secondary'>
														-
													</Typography>
												)}
											</Box>
										</TableCell>
									</TableRow>,
								]

								if (hasDescription) {
									rows.push(
										<TableRow
											key={`${documentId}-description`}
											sx={{
												'&:hover': {
													backgroundColor: 'action.hover',
												},
												'& td': {
													borderTop: 'none',
												},
											}}
										>
											<TableCell colSpan={3}>
												<Box
													sx={{
														'& p': {
															margin: 0,
															mb: 1,
														},
														'& p:last-child': {
															mb: 0,
														},
														'& a': {
															color: 'primary.main',
															textDecoration: 'none',
															'&:hover': {
																textDecoration: 'underline',
															},
														},
													}}
													dangerouslySetInnerHTML={{ __html: descriptionHtml }}
												/>
											</TableCell>
										</TableRow>,
									)
								}

								return rows
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</Container>
		</SectionContainer>
	)
}


import { Container, Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import type { SupplementalDocumentGroupSection, SupplementalDocument } from '@/types'
import type { ThemeDefinition } from '@/themes'

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
			// Sortiere nach Name, falls SortOrd nicht vorhanden
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
		<Box
			component='section'
			sx={{
				mb: 8,
				px: 2,
				backgroundColor,
			}}
		>
			<Container maxWidth='md'>
				{section.GroupHeadline ? (
					<Typography
						variant='h2'
						component='h2'
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
						variant='h2'
						component='h2'
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
								<TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>Beschreibung</TableCell>
								<TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
								<TableCell sx={{ fontWeight: 600 }} align='right'>Download</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{visibleDocuments.map((document) => {
								const documents = document.DownloadDocument || []
								const documentId = document.documentId || document.Name || 'unknown'

								return (
									<TableRow
										key={documentId}
										sx={{
											'&:hover': {
												backgroundColor: 'action.hover',
											},
										}}
									>
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
										<TableCell>
											{document.Description ? (
												<Box
													sx={{
														'& p': {
															margin: 0,
														},
													}}
													dangerouslySetInnerHTML={{ __html: document.Description }}
												/>
											) : (
												<Typography variant='body2' color='text.secondary'>
													-
												</Typography>
											)}
										</TableCell>
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
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</Container>
		</Box>
	)
}


import { Container, Box, Typography, Card, CardContent, Button, Stack, Chip } from '@mui/material'
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

				<Stack spacing={2}>
					{visibleDocuments.map((document) => {
						const documents = document.DownloadDocument || []
						const documentId = document.documentId || document.Name || 'unknown'

						return (
							<Card
								key={documentId}
								sx={{
									transition: 'box-shadow 0.3s ease-in-out',
									'&:hover': {
										boxShadow: 4,
									},
								}}
							>
								<CardContent>
									<Box
										sx={{
											display: 'flex',
											flexDirection: { xs: 'column', md: 'row' },
											gap: 2,
											alignItems: { md: 'center' },
											justifyContent: { md: 'space-between' },
										}}
									>
										<Box sx={{ flex: 1 }}>
											{document.Name ? (
												<Typography
													variant='h6'
													component='h3'
													sx={{
														fontWeight: 600,
														color: 'text.primary',
														mb: 1,
													}}
												>
													{document.Name}
												</Typography>
											) : null}
											{document.Description ? (
												<Typography
													variant='body2'
													sx={{
														mt: 1,
														color: 'text.secondary',
														'& p': {
															margin: 0,
														},
													}}
													dangerouslySetInnerHTML={{ __html: document.Description }}
												/>
											) : null}
											{document.ShortId ? (
												<Chip
													label={`ID: ${document.ShortId}`}
													size='small'
													sx={{
														mt: 1,
														fontSize: '0.75rem',
													}}
												/>
											) : null}
										</Box>

										<Stack
											direction='column'
											spacing={1}
											sx={{
												alignItems: { xs: 'stretch', md: 'flex-end' },
											}}
										>
											{documents.map((file, fileIndex) => {
												const fileUrl = file.url.startsWith('http')
													? file.url
													: `${strapiBaseUrl}${file.url}`

												return (
													<Box key={fileIndex}>
														<Button
															component='a'
															href={fileUrl}
															download
															variant='contained'
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
																display='block'
																sx={{
																	mt: 0.5,
																	textAlign: { xs: 'left', md: 'right' },
																	color: 'text.secondary',
																	fontSize: '0.75rem',
																}}
															>
																{file.name && `(${file.name})`}
																{file.name && file.size && ' '}
																{file.size && formatFileSize(file.size)}
															</Typography>
														)}
													</Box>
												)
											})}
										</Stack>
									</Box>
								</CardContent>
							</Card>
						)
					})}
				</Stack>
			</Container>
		</Box>
	)
}


import { Container, Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import type { DocumentBundleSection, BundleDocuments } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'

interface DocumentBundleSectionComponentProps {
    section: DocumentBundleSection
    strapiBaseUrl: string
    theme: ThemeDefinition
}

function formatFileSize(bytes: number | null | undefined): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentBundleSectionComponent({
    section,
    strapiBaseUrl,
    theme,
}: DocumentBundleSectionComponentProps) {
    if (!section.DocumentBundle || section.DocumentBundle.length === 0) {
        return null
    }

    // Default to 'even' background color style since we don't have Odd/Even field in this section type yet, or assume standard.
    // Use theme.evenBgColor as safe default or white.
    const backgroundColor = theme.evenBgColor

    return (
        <SectionContainer
            variant='max-width'
            id={section.DocumentBundleAnchor || undefined}
            backgroundColor={backgroundColor}
            paddingTop='2em'
            paddingBottom='2em'
        >
            <Container maxWidth='md'>
                {section.DBSName && (
                    <Typography
                        variant='h3'
                        component='h2'
                        sx={{
                            mb: 2,
                            fontWeight: 600,
                            color: theme.headlineColor,
                            textAlign: 'center'
                        }}
                    >
                        {section.DBSName}
                    </Typography>
                )}

                {section.DBSDescription && (
                    <Typography
                        variant='body1'
                        paragraph
                        sx={{
                            mb: 4,
                            color: theme.textColor,
                            textAlign: 'center'
                        }}
                    >
                        {section.DBSDescription}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.DocumentBundle.map((bundle) => (
                        <Box key={bundle.id}>
                            {bundle.BundleName && (
                                <Typography
                                    variant='h5'
                                    component='h3'
                                    sx={{
                                        mb: 2,
                                        fontWeight: 600,
                                        color: theme.headlineColor,
                                        borderBottom: `2px solid ${theme.buttonColor}`,
                                        paddingBottom: 1,
                                        display: 'inline-block'
                                    }}
                                >
                                    {bundle.BundleName}
                                </Typography>
                            )}

                            <TableContainer component={Paper} sx={{ boxShadow: 1, borderRadius: 2, border: '1px solid #e5e7eb' }}>
                                <Table>
                                    <TableBody>
                                        {bundle.BundleDocument?.map((doc: BundleDocuments) => {
                                            const file = doc.Document
                                            if (!file) return null

                                            const fileUrl = file.url.startsWith('http')
                                                ? file.url
                                                : `${strapiBaseUrl}${file.url}`

                                            return (
                                                <TableRow key={doc.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell component="th" scope="row" sx={{ py: 1 }}>
                                                        <Typography variant="body1" fontWeight={500}>
                                                            {doc.Name || file.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1, pr: 1 }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                                            {file.ext?.replace('.', '').toUpperCase()} &bull; {formatFileSize(file.size)}
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
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                        {(!bundle.BundleDocument || bundle.BundleDocument.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={2} align="center">
                                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                                        Keine Dokumente vorhanden.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    ))}
                </Box>
            </Container>
        </SectionContainer>
    )
}

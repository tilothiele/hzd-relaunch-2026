import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, List, ListItem, ListItemIcon, ListItemText, Link, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DescriptionIcon from '@mui/icons-material/Description'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import type { CalendarItem } from '@/types'
import { formatDateRange } from '@/lib/calendar-utils'
import { BlocksRenderer } from '@strapi/blocks-react-renderer'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface CalendarDetailsModalProps {
    item: CalendarItem
    isOpen: boolean
    onClose: () => void
    strapiBaseUrl?: string | null
}

export function CalendarDetailsModal({ item, isOpen, onClose, strapiBaseUrl }: CalendarDetailsModalProps) {
    const documents = item.CalendarDocument?.filter(doc => doc.MediaFile?.url) ?? []

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth='md'
            fullWidth
            aria-labelledby='calendar-item-details-title'
        >
            <DialogTitle id='calendar-item-details-title' sx={{ pr: 6 }}>
                <Typography variant='h5' component='span' sx={{ fontWeight: 600 }}>
                    {item.Headline || 'Termindetails'}
                </Typography>
                <IconButton
                    aria-label='close'
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                    <Typography variant='subtitle1' color='primary' sx={{ fontWeight: 600, mb: 1 }}>
                        {formatDateRange(item.Date, item.Time, item.DateTo)}
                    </Typography>
                    {item.Region ? (
                        <Typography variant='body2' color='text.secondary'>
                            Region: {item.Region}
                        </Typography>
                    ) : null}
                </Box>

                {item.LongDescription ? (
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            variant='body1'
                            component='div'
                            sx={{
                                textAlign: 'justify',
                                color: 'text.primary',
                                lineHeight: 1.6,
                                '& p': { mb: 2 },
                                '& ul, & ol': { mb: 2, pl: 3 },
                                '& a': { color: 'primary.main', textDecoration: 'underline' }
                            }}
                            dangerouslySetInnerHTML={{ __html: item.LongDescription }}
                        />
                    </Box>
                ) : item.Description ? (
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            variant='body1'
                            component='div'
                            sx={{
                                textAlign: 'justify',
                                color: 'text.primary',
                                lineHeight: 1.6
                            }}
                        >
                            {Array.isArray(item.Description) ? (
                                <BlocksRenderer content={item.Description as any} />
                            ) : (
                                <span style={{ whiteSpace: 'pre-wrap' }}>{item.Description}</span>
                            )}
                        </Typography>
                    </Box>
                ) : null}

                {documents.length > 0 ? (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant='h6' sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DescriptionIcon fontSize='small' /> Dokumente
                        </Typography>
                        <List dense>
                            {documents.map((doc, index) => {
                                const media = doc.MediaFile
                                if (!media?.url) return null
                                const fileName = media.name || `Dokument ${index + 1}`
                                const fileExt = media.ext ? ` (${media.ext.toUpperCase().replace('.', '')})` : ''

                                return (
                                    <ListItem key={index} disableGutters>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <FileDownloadIcon color='action' />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Link
                                                    href={resolveMediaUrl(media, strapiBaseUrl) || '#'}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    sx={{
                                                        color: 'primary.main',
                                                        textDecoration: 'none',
                                                        '&:hover': { textDecoration: 'underline' }
                                                    }}
                                                >
                                                    {fileName}{fileExt}
                                                </Link>
                                            }
                                            secondary={media.alternativeText}
                                        />
                                    </ListItem>
                                )
                            })}
                        </List>
                    </Box>
                ) : null}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant='outlined' color='inherit'>
                    Schließen
                </Button>
            </DialogActions>
        </Dialog>
    )
}

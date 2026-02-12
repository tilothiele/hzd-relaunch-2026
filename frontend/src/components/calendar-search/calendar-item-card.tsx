import { useState } from 'react'
import { Paper, Box, Typography, Button } from '@mui/material'
import type { CalendarItem } from '@/types'
import { getCalendarColors, formatDateRange } from '@/lib/calendar-utils'
import { ExternalRegistrationLink, InternalRegistrationLink } from '@/components/calendar/registration-links'
import { CalendarDetailsModal } from './calendar-details-modal'
import { BlocksRenderer } from '@strapi/blocks-react-renderer'

interface CalendarItemCardProps {
    item: CalendarItem
    index: number
    registrationOpen: boolean
}

export function CalendarItemCard({ item, index, registrationOpen }: CalendarItemCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const calendarColors = item.calendar ? getCalendarColors(item.calendar) : null
    const isEven = index % 2 === 0

    const hasExtraDetails = !!(item.LongDescription || (item.CalendarDocument && item.CalendarDocument.some(doc => doc.MediaFile?.url)))

    return (
        <>
            <Paper
                elevation={2}
                sx={{
                    paddingX: 3,
                    paddingY: 1,
                    backgroundColor: isEven ? '#ffffff' : '#f9fafb',
                    borderLeft: calendarColors
                        ? `8px solid ${calendarColors.backgroundColor}`
                        : '8px solid #e5e7eb',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: 'wrap',
                        flexDirection: { xs: 'column', sm: 'column', md: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'flex-start', md: 'center' },
                    }}
                >
                    {/* Datum Spalte */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            flexWrap: 'wrap',
                            flex: { xs: 'none', sm: 'none', md: '0 0 auto' },
                            width: { xs: '100%', sm: '100%', md: 'auto' },
                        }}
                    >
                        <Typography
                            variant='subtitle1'
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                flexShrink: 0,
                            }}
                        >
                            {formatDateRange(item.Date, item.Time, item.DateTo)}
                        </Typography>

                        {/* Links (Mobile/Tablet) */}
                        <Box
                            sx={{
                                display: { xs: 'flex', sm: 'flex', md: 'none' },
                                flexWrap: 'wrap',
                                gap: 2,
                                alignItems: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {hasExtraDetails ? (
                                <Button
                                    variant='outlined'
                                    size='small'
                                    onClick={() => setIsModalOpen(true)}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Details
                                </Button>
                            ) : null}
                            {registrationOpen && item.AnmeldeLink ? (
                                <ExternalRegistrationLink href={item.AnmeldeLink} />
                            ) : null}
                            {registrationOpen && item.form?.documentId ? (
                                <InternalRegistrationLink href={`/anmeldung/${item.form.documentId}`} />
                            ) : null}
                        </Box>
                    </Box>

                    {/* Inhalt Spalte */}
                    <Box
                        sx={{
                            flex: { xs: 'none', sm: 'none', md: 1 },
                            minWidth: 0,
                            width: { xs: '100%', sm: '100%', md: 'auto' },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        {item.Headline ? (
                            <Typography
                                variant='body1'
                                sx={{
                                    fontWeight: 500,
                                    color: 'text.primary',
                                }}
                            >
                                {item.Headline}
                            </Typography>
                        ) : null}
                        {item.Headline && item.Description ? (
                            <Typography
                                variant='body1'
                                sx={{
                                    color: 'text.secondary',
                                }}
                            >
                                -
                            </Typography>
                        ) : null}
                        {item.Description ? (
                            <Typography
                                variant='body1'
                                component='div'
                                sx={{
                                    color: 'text.secondary',
                                    '& p': { mb: 0 }
                                }}
                            >
                                {Array.isArray(item.Description) ? (
                                    <BlocksRenderer content={item.Description as any} />
                                ) : (
                                    <span style={{ whiteSpace: 'pre-wrap' }}>{item.Description}</span>
                                )}
                            </Typography>
                        ) : null}
                    </Box>

                    {/* Links (Desktop) */}
                    <Box
                        sx={{
                            display: { xs: 'none', sm: 'none', md: 'flex' },
                            flexWrap: 'wrap',
                            gap: 2,
                            alignItems: 'center',
                            flexShrink: 0,
                        }}
                    >
                        {hasExtraDetails ? (
                            <Button
                                variant='outlined'
                                size='small'
                                onClick={() => setIsModalOpen(true)}
                                sx={{ textTransform: 'none' }}
                            >
                                Details
                            </Button>
                        ) : null}
                        {registrationOpen && item.AnmeldeLink ? (
                            <ExternalRegistrationLink href={item.AnmeldeLink} />
                        ) : null}
                        {registrationOpen && item.form?.documentId ? (
                            <InternalRegistrationLink href={`/anmeldung/${item.form.documentId}`} />
                        ) : null}
                    </Box>
                </Box>
            </Paper>

            <CalendarDetailsModal
                item={item}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}

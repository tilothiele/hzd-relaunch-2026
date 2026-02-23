import { useState } from 'react'
import { Paper, Box, Typography, Button } from '@mui/material'
import type { CalendarItem } from '@/types'
import { getCalendarColors, formatDateRange } from '@/lib/calendar-utils'
import { ExternalRegistrationLink, InternalRegistrationLink, ResultLink } from '@/components/calendar/registration-links'
import { CalendarDetailsModal } from './calendar-details-modal'
import { BlocksRenderer } from '@strapi/blocks-react-renderer'

interface CalendarItemCardProps {
    item: CalendarItem
    index: number
    registrationOpen: boolean
    strapiBaseUrl?: string | null
}

export function CalendarItemCard({ item, index, registrationOpen, strapiBaseUrl }: CalendarItemCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const calendarColors = item.calendar ? getCalendarColors(item.calendar) : null
    const isEven = index % 2 === 0
    const now = Date.now()

    const hasExtraDetails = !!(item.LongDescription || (item.CalendarDocument && item.CalendarDocument.some(doc => doc.MediaFile?.url)))

    // Logic for AnmeldeLink visibility
    const isAnmeldeLinkVisible = () => {
        if (!item.AnmeldeLink) return false
        if (!registrationOpen) return false

        if (item.AnmeldeLinkVisibleFrom && new Date(item.AnmeldeLinkVisibleFrom).getTime() > now) return false

        return true
    }

    // Logic for ErgebnisLink visibility
    const isErgebnisLinkVisible = () => {
        if (!item.ErgebnisLink) return false
        if (!item.ErgebnisLinkVisibleFrom) return true // Default visible if no start date set? Or hidden? User said "nur nach...". Usually implies if set check it. If not set, usually visible? "nur nach... angezeigt werden" -> if null, maybe always? or never? Assuming always visible if not restricted, logic for optional dates. "diese Datum sind optional". So if null -> visible.

        return new Date(item.ErgebnisLinkVisibleFrom).getTime() <= now
    }

    const showAnmeldeLink = isAnmeldeLinkVisible()
    const showErgebnisLink = isErgebnisLinkVisible()

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
                            {showAnmeldeLink && item.AnmeldeLink ? (
                                <ExternalRegistrationLink href={item.AnmeldeLink} />
                            ) : null}
                            {registrationOpen && item.form?.documentId ? (
                                <InternalRegistrationLink href={`/anmeldung/${item.form.documentId}`} />
                            ) : null}
                            {showErgebnisLink && item.ErgebnisLink ? (
                                <ResultLink href={item.ErgebnisLink} />
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
                        {showAnmeldeLink && item.AnmeldeLink ? (
                            <ExternalRegistrationLink href={item.AnmeldeLink} />
                        ) : null}
                        {registrationOpen && item.form?.documentId ? (
                            <InternalRegistrationLink href={`/anmeldung/${item.form.documentId}`} />
                        ) : null}
                        {showErgebnisLink && item.ErgebnisLink ? (
                            <ResultLink href={item.ErgebnisLink} />
                        ) : null}
                    </Box>
                </Box>
            </Paper>

            <CalendarDetailsModal
                item={item}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                strapiBaseUrl={strapiBaseUrl}
            />
        </>
    )
}

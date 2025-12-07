'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, Checkbox, FormControlLabel, FormGroup, Paper } from '@mui/material'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_CALENDARS, SEARCH_CALENDAR_ITEMS } from '@/lib/graphql/queries'
import type { Calendar, CalendarItem, CalendarSearchResult, CalendarItemSearchResult } from '@/types'
import { SectionContainer } from '@/components/sections/section-container/section-container'

interface CalendarSearchProps {
	strapiBaseUrl?: string | null
	theme?: { oddBgColor: string; evenBgColor: string }
}

export function CalendarSearch({ strapiBaseUrl, theme }: CalendarSearchProps) {
	const [calendars, setCalendars] = useState<Calendar[]>([])
	const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
	const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set())
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const loadCalendars = useCallback(async () => {
		if (!strapiBaseUrl) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const data = await fetchGraphQL<CalendarSearchResult>(
				GET_CALENDARS,
				{
					baseUrl: strapiBaseUrl,
				},
			)

			const calendarsArray = Array.isArray(data.calendars) ? data.calendars : []
			setCalendars(calendarsArray)
			// Default: Alle Kalender auswählen
			setSelectedCalendarIds(new Set(calendarsArray.map((cal) => cal.documentId)))
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Kalender konnten nicht geladen werden.')
			setError(fetchError)
			setCalendars([])
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl])

	const loadCalendarItems = useCallback(async () => {
		if (!strapiBaseUrl || selectedCalendarIds.size === 0) {
			setCalendarItems([])
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const filterConditions: Array<Record<string, unknown>> = [
				{
					calendar: {
						documentId: {
							in: Array.from(selectedCalendarIds),
						},
					},
				},
			]

			const variables: Record<string, unknown> = {
				filters: {
					and: filterConditions,
				},
				sort: ['Date:asc'],
			}

			const data = await fetchGraphQL<CalendarItemSearchResult>(
				SEARCH_CALENDAR_ITEMS,
				{
					baseUrl: strapiBaseUrl,
					variables,
				},
			)

			const itemsArray = Array.isArray(data.calendarEntries) ? data.calendarEntries : []
			setCalendarItems(itemsArray)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Kalendereinträge konnten nicht geladen werden.')
			setError(fetchError)
			setCalendarItems([])
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, selectedCalendarIds])

	useEffect(() => {
		void loadCalendars()
	}, [loadCalendars])

	useEffect(() => {
		void loadCalendarItems()
	}, [loadCalendarItems])

	const handleCalendarToggle = useCallback((calendarId: string) => {
		setSelectedCalendarIds((prev) => {
			const next = new Set(prev)
			if (next.has(calendarId)) {
				next.delete(calendarId)
			} else {
				next.add(calendarId)
			}
			return next
		})
	}, [])

	const sortedItems = useMemo(() => {
		return [...calendarItems].sort((a, b) => {
			const dateA = a.Date ? new Date(a.Date).getTime() : 0
			const dateB = b.Date ? new Date(b.Date).getTime() : 0
			return dateA - dateB
		})
	}, [calendarItems])

	const formatDate = useCallback((dateString: string | null | undefined) => {
		if (!dateString) {
			return 'Kein Datum'
		}
		try {
			const date = new Date(dateString)
			return date.toLocaleDateString('de-DE', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})
		} catch {
			return dateString
		}
	}, [])

	const backgroundColor = theme?.evenBgColor ?? '#f9fafb'

	return (
		<>
			{/* Multiselect im Kopfbereich */}
			<div className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em', backgroundColor }}>
				<div className='w-full max-w-7xl'>
					<Typography variant='h6' component='h2' sx={{ mb: 2, fontWeight: 600 }}>
						Kalender auswählen
					</Typography>
					{isLoading && calendars.length === 0 ? (
						<Typography variant='body2' color='text.secondary'>
							Lade Kalender...
						</Typography>
					) : calendars.length > 0 ? (
						<FormGroup>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
								{calendars.map((calendar) => (
									<FormControlLabel
										key={calendar.documentId}
										control={
											<Checkbox
												checked={selectedCalendarIds.has(calendar.documentId)}
												onChange={() => handleCalendarToggle(calendar.documentId)}
											/>
										}
										label={calendar.Name ?? 'Unbenannter Kalender'}
										sx={{
											'& .MuiFormControlLabel-label': {
												fontSize: '0.875rem',
											},
										}}
									/>
								))}
							</Box>
						</FormGroup>
					) : (
						<Typography variant='body2' color='text.secondary'>
							Keine Kalender verfügbar
						</Typography>
					)}
				</div>
			</div>

			{/* Content-Bereich in SectionContainer */}
			<SectionContainer
				variant='max-width'
				backgroundColor={backgroundColor}
				paddingTop='1em'
				paddingBottom='1em'
			>
				{error ? (
					<Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
						<Typography variant='body2'>{error.message}</Typography>
					</Box>
				) : null}

				{isLoading && calendarItems.length === 0 ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<Typography variant='body2' color='text.secondary'>
							Lade Kalendereinträge...
						</Typography>
					</Box>
				) : sortedItems.length > 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{sortedItems.map((item) => (
							<Paper
								key={item.documentId}
								elevation={2}
								sx={{
									p: 3,
									borderLeft: item.calendar?.ColorSchema
										? `4px solid ${item.calendar.ColorSchema}`
										: '4px solid #e5e7eb',
								}}
							>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
										<Typography
											variant='subtitle1'
											sx={{
												fontWeight: 600,
												color: 'text.primary',
											}}
										>
											{formatDate(item.Date)}
										</Typography>
										{item.calendar?.Name ? (
											<Typography
												variant='caption'
												sx={{
													px: 1.5,
													py: 0.5,
													bgcolor: item.calendar.ColorSchema ?? 'grey.300',
													color: 'white',
													borderRadius: 1,
													fontWeight: 500,
												}}
											>
												{item.calendar.Name}
											</Typography>
										) : null}
									</Box>
									{item.Description ? (
										<Typography
											variant='body1'
											sx={{
												color: 'text.secondary',
												whiteSpace: 'pre-wrap',
											}}
										>
											{item.Description}
										</Typography>
									) : null}
								</Box>
							</Paper>
						))}
					</Box>
				) : !isLoading ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<Typography variant='body2' color='text.secondary'>
							Keine Kalendereinträge gefunden.
						</Typography>
					</Box>
				) : null}
			</SectionContainer>
		</>
	)
}


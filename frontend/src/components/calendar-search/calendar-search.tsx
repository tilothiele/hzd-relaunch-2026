'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, Paper, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_CALENDARS, SEARCH_CALENDAR_ITEMS } from '@/lib/graphql/queries'
import type { Calendar, CalendarItem, CalendarSearchResult, CalendarItemSearchResult } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { ExternalRegistrationLink, InternalRegistrationLink } from '@/components/calendar/registration-links'

import { getCalendarColors } from '@/lib/calendar-utils'
import { CalendarItemCard } from './calendar-item-card'

interface CalendarSearchProps {
	strapiBaseUrl?: string | null
	theme?: ThemeDefinition
}

interface CalendarColors {
	backgroundColor: string
	textColor: string
}

export function CalendarSearch({ strapiBaseUrl, theme }: CalendarSearchProps) {
	const [calendars, setCalendars] = useState<Calendar[]>([])
	const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
	const [allCalendarItems, setAllCalendarItems] = useState<CalendarItem[]>([])
	const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set())
	const [selectedRegion, setSelectedRegion] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	const getPrimaryDate = useCallback((item: CalendarItem): string | null | undefined => {
		return item.Date ?? item.DueDate ?? item.VisibleFrom ?? item.VisibleTo ?? item.createdAt ?? null
	}, [])

	const toDateTime = useCallback((dateString?: string | null, timeString?: string | null): Date | null => {
		if (!dateString) {
			return null
		}
		const iso = timeString ? `${dateString}T${timeString}` : `${dateString}T00:00:00`
		const parsed = new Date(iso)
		return Number.isNaN(parsed.getTime()) ? null : parsed
	}, [])

	const isWithinVisibility = useCallback((item: CalendarItem, now: number): boolean => {
		const fromOk = !item.VisibleFrom || new Date(item.VisibleFrom).getTime() <= now
		const toOk = !item.VisibleTo || new Date(item.VisibleTo).getTime() >= now
		return fromOk && toOk
	}, [])

	const isFutureEntry = useCallback((item: CalendarItem, now: number): boolean => {
		const dt = toDateTime(item.Date, item.Time)
		if (dt) {
			return dt.getTime() >= now
		}
		const due = item.DueDate ? new Date(item.DueDate).getTime() : null
		return due !== null && !Number.isNaN(due) ? due >= now : false
	}, [toDateTime])

	const parseDueDateMs = useCallback((dueDate: string | null | undefined): number | null => {
		if (!dueDate) {
			return null
		}

		const trimmed = dueDate.trim()
		if (!trimmed) {
			return null
		}

		// ISO Date-Only (yyyy-mm-dd): bis Tagesende gültig, UTC
		const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
		if (isoDateOnly) {
			const parsed = Date.parse(`${trimmed}T23:59:59Z`)
			return Number.isNaN(parsed) ? null : parsed
		}

		// ISO mit Zeit oder Offset
		const isoParsed = Date.parse(trimmed)
		if (!Number.isNaN(isoParsed)) {
			return isoParsed
		}

		// Fallback: deutsches Datum dd.mm.yyyy
		const deMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed)
		if (deMatch) {
			const [, dd, mm, yyyy] = deMatch
			const parsed = Date.parse(`${yyyy}-${mm}-${dd}T23:59:59Z`)
			return Number.isNaN(parsed) ? null : parsed
		}

		return null
	}, [])

	const isRegistrationOpen = useCallback((item: CalendarItem): boolean => {
		const dueMs = parseDueDateMs(item.DueDate)
		if (dueMs === null) {
			return true
		}
		return Date.now() <= dueMs
	}, [parseDueDateMs])

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
			calendarsArray.sort((a, b) => {
				const ordA = a.Ord ?? 999
				const ordB = b.Ord ?? 999
				if (ordA !== ordB) return ordA - ordB
				return (a.Name ?? '').localeCompare(b.Name ?? '')
			})
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

	const loadAllCalendarItems = useCallback(async () => {
		if (!strapiBaseUrl || selectedCalendarIds.size === 0) {
			setAllCalendarItems([])
			return
		}

		try {
			const todayIso = new Date().toISOString().slice(0, 10)
			const nowIso = new Date().toISOString()
			const filterConditions: Array<Record<string, unknown>> = [
				{
					calendar: {
						documentId: {
							in: Array.from(selectedCalendarIds),
						},
					},
				},
				{
					Date: {
						gte: todayIso,
					},
				},
				{
					or: [
						{ VisibleFrom: { null: true } },
						{ VisibleFrom: { lte: nowIso } },
					],
				},
				{
					or: [
						{ VisibleTo: { null: true } },
						{ VisibleTo: { gte: nowIso } },
					],
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
			const nowTs = Date.now()
			const visibleItems = itemsArray.filter((item) => isFutureEntry(item, nowTs) && isWithinVisibility(item, nowTs))
			setAllCalendarItems(visibleItems)
		} catch (err) {
			// Fehler beim Laden aller Items ignorieren
			setAllCalendarItems([])
		}
	}, [strapiBaseUrl, selectedCalendarIds, isFutureEntry, isWithinVisibility])

	const loadCalendarItems = useCallback(async () => {
		if (!strapiBaseUrl || selectedCalendarIds.size === 0) {
			setCalendarItems([])
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const todayIso = new Date().toISOString().slice(0, 10)
			const nowIso = new Date().toISOString()
			const filterConditions: Array<Record<string, unknown>> = [
				{
					calendar: {
						documentId: {
							in: Array.from(selectedCalendarIds),
						},
					},
				},
				{
					Date: {
						gte: todayIso,
					},
				},
				{
					or: [
						{ VisibleFrom: { null: true } },
						{ VisibleFrom: { lte: nowIso } },
					],
				},
				{
					or: [
						{ VisibleTo: { null: true } },
						{ VisibleTo: { gte: nowIso } },
					],
				},
			]

			// Region-Filter hinzufügen, falls ausgewählt
			if (selectedRegion) {
				filterConditions.push({
					Region: {
						eq: selectedRegion,
					},
				})
			}

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
			const nowTs = Date.now()
			const visibleItems = itemsArray.filter((item) => isFutureEntry(item, nowTs) && isWithinVisibility(item, nowTs))
			setCalendarItems(visibleItems)
		} catch (err) {
			const fetchError = err instanceof Error
				? err
				: new Error('Kalendereinträge konnten nicht geladen werden.')
			setError(fetchError)
			setCalendarItems([])
		} finally {
			setIsLoading(false)
		}
	}, [strapiBaseUrl, selectedCalendarIds, selectedRegion, isFutureEntry, isWithinVisibility])

	useEffect(() => {
		void loadCalendars()
	}, [loadCalendars])

	useEffect(() => {
		void loadAllCalendarItems()
	}, [loadAllCalendarItems])

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

	const availableRegions = useMemo(() => {
		const regions = new Set<string>()
		allCalendarItems.forEach((item) => {
			if (item.Region) {
				regions.add(item.Region)
			}
		})
		return Array.from(regions).sort()
	}, [allCalendarItems])

	const sortedItems = useMemo(() => {
		return [...calendarItems].sort((a, b) => {
			const dateAValue = getPrimaryDate(a)
			const dateBValue = getPrimaryDate(b)
			const dateA = dateAValue ? new Date(dateAValue).getTime() : 0
			const dateB = dateBValue ? new Date(dateBValue).getTime() : 0
			return dateA - dateB
		})
	}, [calendarItems, getPrimaryDate])

	const backgroundColor = theme?.evenBgColor ?? '#f9fafb'

	return (
		<>
			{/* Multiselect im Kopfbereich */}
			<div className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em', backgroundColor }}>
				<div className='w-full max-w-7xl'>
					{isLoading && calendars.length === 0 ? (
						<Typography variant='body2' color='text.secondary'>
							Lade Kalender...
						</Typography>
					) : calendars.length > 0 ? (
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
								{calendars.map((calendar) => {
									const colors = getCalendarColors(calendar)
									const isSelected = selectedCalendarIds.has(calendar.documentId)
									return (
										<Button
											key={calendar.documentId}
											variant={isSelected ? 'contained' : 'outlined'}
											onClick={() => handleCalendarToggle(calendar.documentId)}
											sx={{
												minWidth: 'auto',
												backgroundColor: isSelected ? colors.backgroundColor : 'transparent',
												color: isSelected ? colors.textColor : colors.backgroundColor,
												borderColor: colors.backgroundColor,
												borderWidth: '2px',
												borderStyle: 'solid',
												fontWeight: isSelected ? 600 : 400,
												textTransform: 'none',
												boxShadow: isSelected ? 2 : 'none',
												padding: '4px 12px',
												fontSize: '0.875rem',
												'&:hover': {
													backgroundColor: isSelected ? colors.backgroundColor : `${colors.backgroundColor}20`,
													borderColor: colors.backgroundColor,
													boxShadow: isSelected ? 3 : 1,
												},
											}}
										>
											{calendar.Name ?? 'Unbenannter Kalender'}
										</Button>
									)
								})}
							</Box>

							{/* Region Dropdown */}
							<FormControl size='small' sx={{ minWidth: 200 }}>
								<InputLabel id='region-select-label'>Region</InputLabel>
								<Select
									labelId='region-select-label'
									id='region-select'
									value={selectedRegion}
									label='Region'
									onChange={(e) => setSelectedRegion(e.target.value)}
								>
									<MenuItem value=''>
										<em>Alle Regionen</em>
									</MenuItem>
									{availableRegions.map((region) => (
										<MenuItem key={region} value={region}>
											{region}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Box>
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
						{sortedItems.map((item, index) => (
							<CalendarItemCard
								key={item.documentId}
								item={item}
								index={index}
								registrationOpen={isRegistrationOpen(item)}
							/>
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

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, Paper, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_CALENDARS, SEARCH_CALENDAR_ITEMS } from '@/lib/graphql/queries'
import type { Calendar, CalendarItem, CalendarSearchResult, CalendarItemSearchResult } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { ExternalRegistrationLink, InternalRegistrationLink } from '@/components/calendar/registration-links'

interface CalendarSearchProps {
	strapiBaseUrl?: string | null
	theme?: ThemeDefinition
}

interface CalendarColors {
	backgroundColor: string
	textColor: string
}

/**
 * Mappt ColorSchema Enumeration-Werte (vom GraphQL Backend) auf konkrete Farben
 * Enumeration-Werte: Gelb, Gruen, Pink, Rot, Violet
 */
function getColorBySchema(colorSchema: Calendar['ColorSchema']): { backgroundColor: string; textColor: string } {
	if (!colorSchema) {
		return {
			backgroundColor: '#6b7280',
			textColor: '#ffffff',
		}
	}

	// Mapping basierend auf ColorSchema Enumeration-Werten vom GraphQL Backend
	const colorMap: Record<string, { backgroundColor: string; textColor: string }> = {
		Gelb: {
			backgroundColor: '#FAD857',
			textColor: '#000000',
		},
		Gruen: {
			backgroundColor: '#10b981',
			textColor: '#ffffff',
		},
		Pink: {
			backgroundColor: '#ec4899',
			textColor: '#ffffff',
		},
		Rot: {
			backgroundColor: '#ef4444',
			textColor: '#ffffff',
		},
		Violet: {
			backgroundColor: '#A8267D',
			textColor: '#ffffff',
		},
	}

	// Prüfe ob ColorSchema ein bekannter Enumeration-Wert ist
	const normalizedSchema = colorSchema.trim()
	if (colorMap[normalizedSchema]) {
		return colorMap[normalizedSchema]
	}

	// Fallback: Wenn ColorSchema ein Hex-Code oder anderer Wert ist, verwende ihn direkt
	// Textfarbe basierend auf Helligkeit der Hintergrundfarbe
	const textColor = getContrastTextColor(colorSchema)
	return {
		backgroundColor: colorSchema,
		textColor,
	}
}

/**
 * Weist jedem Kalender Hintergrund- und Textfarbe basierend auf ColorSchema Enumeration zu
 */
function getCalendarColors(calendar: Calendar): CalendarColors {
	return getColorBySchema(calendar.ColorSchema)
}

/**
 * Bestimmt die passende Textfarbe basierend auf der Helligkeit der Hintergrundfarbe
 */
function getContrastTextColor(backgroundColor: string): string {
	// Entferne # falls vorhanden
	const hex = backgroundColor.replace('#', '')

	// Konvertiere zu RGB
	const r = parseInt(hex.substring(0, 2), 16)
	const g = parseInt(hex.substring(2, 4), 16)
	const b = parseInt(hex.substring(4, 6), 16)

	// Berechne relative Luminanz (Formel nach WCAG)
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

	// Wenn Luminanz > 0.5, ist der Hintergrund hell -> dunkler Text
	// Wenn Luminanz <= 0.5, ist der Hintergrund dunkel -> heller Text
	return luminance > 0.5 ? '#000000' : '#ffffff'
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

	const isRegistrationOpen = useCallback((item: CalendarItem): boolean => {
		if (!item.DueDate) {
			return true
		}
		const due = new Date(item.DueDate).getTime()
		if (Number.isNaN(due)) {
			return true
		}
		return Date.now() <= due
	}, [])

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

	const formatTime = useCallback((timeString: string | null | undefined) => {
		if (!timeString) {
			return ''
		}
		try {
			const date = new Date(`1970-01-01T${timeString}`)
			return Number.isNaN(date.getTime())
				? timeString
				: date.toLocaleTimeString('de-DE', {
					hour: '2-digit',
					minute: '2-digit',
				})
		} catch {
			return timeString
		}
	}, [])

	const formatDateRange = useCallback((
		date: string | null | undefined,
		time: string | null | undefined,
		dateTo: string | null | undefined,
	) => {
		const startDate = formatDate(date)
		const startTime = formatTime(time)
		const endDate = dateTo ? formatDate(dateTo) : ''

		let result = startDate
		if (startTime) {
			result = `${result}, ${startTime}`
		}
		if (endDate) {
			result = `${result} – ${endDate}`
		}
		return result
	}, [formatDate, formatTime])

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
						{sortedItems.map((item, index) => {
							const registrationOpen = isRegistrationOpen(item)
							const calendarColors = item.calendar ? getCalendarColors(item.calendar) : null
							const isEven = index % 2 === 0
							return (
								<Paper
									key={item.documentId}
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
									{/* Desktop: Eine Zeile: Datum - Description - Links */}
									{/* Mobile/Tablet: Zeile 1: Datum - Links, Zeile 2: Headline - Description */}
									<Box
										sx={{
											display: 'flex',
											gap: 2,
											flexWrap: 'wrap',
											flexDirection: { xs: 'column', sm: 'column', md: 'row' },
											alignItems: { xs: 'flex-start', sm: 'flex-start', md: 'center' },
										}}
									>
										{/* Erste Zeile (Mobile/Tablet) / Erste Spalte (Desktop): Datum + Links */}
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
											{/* Datum */}
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

											{/* Links und Aktionen - auf Mobile/Tablet in derselben Zeile wie Datum */}
											<Box
												sx={{
													display: { xs: 'flex', sm: 'flex', md: 'none' },
													flexWrap: 'wrap',
													gap: 2,
													alignItems: 'center',
													flexShrink: 0,
												}}
											>
												{registrationOpen && item.AnmeldeLink ? (
													<ExternalRegistrationLink href={item.AnmeldeLink} />
												) : null}
												{registrationOpen && item.form?.documentId ? (
													<InternalRegistrationLink href={`/anmeldung/${item.form.documentId}`} />
												) : null}
											</Box>
										</Box>

										{/* Headline und Description - auf Mobile/Tablet in zweiter Zeile */}
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
													sx={{
														color: 'text.secondary',
														whiteSpace: 'pre-wrap',
													}}
												>
													{item.Description}
												</Typography>
											) : null}
										</Box>

										{/* Links und Aktionen - nur auf Desktop sichtbar */}
										<Box
											sx={{
												display: { xs: 'none', sm: 'none', md: 'flex' },
												flexWrap: 'wrap',
												gap: 2,
												alignItems: 'center',
												flexShrink: 0,
											}}
										>
											{registrationOpen && item.AnmeldeLink ? (
												<ExternalRegistrationLink href={item.AnmeldeLink} />
											) : null}
											{registrationOpen && item.form?.documentId ? (
												<InternalRegistrationLink href={`/anmeldung/${item.form.documentId}`} />
											) : null}
										</Box>
									</Box>
								</Paper>
							)
						})}
					</Box>
				) : !isLoading ? (
					<Box sx={{ textAlign: 'center', py: 4 }}>
						<Typography variant='body2' color='text.secondary'>
							Keine Kalendereinträge gefunden.
						</Typography>
					</Box>
				) : null}
			</SectionContainer>

			{/* Keine Modal-Ansicht mehr, Daten werden direkt in der Liste gezeigt */}
		</>
	)
}

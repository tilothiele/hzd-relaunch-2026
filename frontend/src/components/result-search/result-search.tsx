'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, Paper, Button, Link as MuiLink, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { fetchGraphQL } from '@/lib/graphql-client'
import { GET_CALENDARS, SEARCH_CALENDAR_ITEMS } from '@/lib/graphql/queries'
import type { Calendar, CalendarItem, CalendarSearchResult, CalendarItemSearchResult } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { SectionContainer } from '@/components/sections/section-container/section-container'
import { renderStrapiBlocks } from '@/lib/strapi-blocks'

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
import { getCalendarColors, formatDate } from '@/lib/calendar-utils'

export function ResultSearch({ strapiBaseUrl, theme }: CalendarSearchProps) {
	const [calendars, setCalendars] = useState<Calendar[]>([])
	const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
	const [allCalendarItems, setAllCalendarItems] = useState<CalendarItem[]>([])
	const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set())
	const [selectedRegion, setSelectedRegion] = useState<string>('')
	// Berechne verfügbare Jahre und Standard-Jahr: aktuelles Jahr + 3 vorherige
	const { availableYears, defaultYear } = useMemo(() => {
		const currentYear = new Date().getFullYear()
		return {
			availableYears: [currentYear, currentYear - 1, currentYear - 2, currentYear - 3],
			defaultYear: currentYear,
		}
	}, [])

	const [selectedYear, setSelectedYear] = useState<number>(defaultYear)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [expandedResultIds, setExpandedResultIds] = useState<Set<string>>(new Set())

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

	const isPastEntry = useCallback((item: CalendarItem, now: number): boolean => {
		const dt = toDateTime(item.Date, item.Time)
		if (dt) {
			return dt.getTime() < now
		}
		const due = item.DueDate ? new Date(item.DueDate).getTime() : null
		return due !== null && !Number.isNaN(due) ? due < now : false
	}, [toDateTime])

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
						lte: todayIso,
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
				sort: ['Date:desc'],
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
			const visibleItems = itemsArray.filter((item) => isPastEntry(item, nowTs) && isWithinVisibility(item, nowTs))
			setAllCalendarItems(visibleItems)
		} catch (err) {
			// Fehler beim Laden aller Items ignorieren
			setAllCalendarItems([])
		}
	}, [strapiBaseUrl, selectedCalendarIds, isPastEntry, isWithinVisibility])

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
			const endOfYearIso = `${selectedYear}-12-31`
			const startOfYearIso = `${selectedYear}-01-01`
			const latestAllowedDate = todayIso < endOfYearIso ? todayIso : endOfYearIso
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
						gte: startOfYearIso,
						lte: latestAllowedDate,
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
				sort: ['Date:desc'],
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
			const visibleItems = itemsArray.filter((item) => isPastEntry(item, nowTs) && isWithinVisibility(item, nowTs))
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
	}, [strapiBaseUrl, selectedCalendarIds, selectedRegion, selectedYear, isPastEntry, isWithinVisibility])

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

	const handleToggleResultText = useCallback((documentId: string) => {
		setExpandedResultIds((prev) => {
			const next = new Set(prev)
			if (next.has(documentId)) {
				next.delete(documentId)
			} else {
				next.add(documentId)
			}
			return next
		})
	}, [])

	const renderResultText = useCallback((value: CalendarItem['ErgebnisText']) => {
		return value ?? ''
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
			return dateB - dateA
		})
	}, [calendarItems, getPrimaryDate])



	const backgroundColor = theme?.evenBgColor ?? '#f9fafb'

	return (
		<>
			{/* Jahr-Auswahl in der obersten Zeile */}
			<div className='flex w-full justify-center px-4' style={{ paddingTop: '1em', paddingBottom: '1em', backgroundColor }}>
				<div className='w-full max-w-7xl'>
					<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
						{availableYears.map((year) => {
							const isSelected = selectedYear === year
							const primaryColor = theme?.buttonColor ?? '#64574E'
							const primaryTextColor = theme?.buttonTextColor ?? '#ffffff'

							return (
								<Button
									key={year}
									variant={isSelected ? 'contained' : 'outlined'}
									onClick={() => setSelectedYear(year)}
									sx={{
										minWidth: '80px',
										backgroundColor: isSelected ? primaryColor : 'transparent',
										color: isSelected ? primaryTextColor : primaryColor,
										borderColor: primaryColor,
										borderWidth: '2px',
										borderStyle: 'solid',
										fontWeight: isSelected ? 600 : 400,
										textTransform: 'none',
										boxShadow: isSelected ? 2 : 'none',
										'&:hover': {
											backgroundColor: isSelected ? primaryColor : `${primaryColor}20`,
											borderColor: primaryColor,
											boxShadow: isSelected ? 3 : 1,
										},
									}}
								>
									{year}
								</Button>
							)
						})}
					</Box>
				</div>
			</div>

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
							const calendarColors = item.calendar ? getCalendarColors(item.calendar) : null
							const isEven = index % 2 === 0
							const isExpanded = expandedResultIds.has(item.documentId)

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
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 2,
											flexWrap: { xs: 'wrap', md: 'nowrap' },
										}}
									>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 2,
												flexWrap: { xs: 'wrap', md: 'nowrap' },
												flex: { xs: '1 1 100%', md: '1 1 auto' },
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
												{formatDate(getPrimaryDate(item))}
											</Typography>

											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													gap: 1,
													flex: 1,
													minWidth: 0,
													flexWrap: 'nowrap',
													overflow: 'hidden',
												}}
											>
												{item.Headline ? (
													<Typography
														variant='body1'
														sx={{
															fontWeight: 500,
															color: 'text.primary',
															whiteSpace: 'nowrap',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
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
															whiteSpace: 'nowrap',
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
															whiteSpace: 'nowrap',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
														}}
													>
														{item.Description}
													</Typography>
												) : null}
											</Box>
										</Box>

										<Box
											sx={{
												display: 'flex',
												flexWrap: 'wrap',
												gap: 2,
												alignItems: 'center',
												flexShrink: 0,
											}}
										>
											{item.ErgebnisLink ? (
												<MuiLink
													href={item.ErgebnisLink}
													target='_blank'
													rel='noopener noreferrer'
													underline='hover'
													sx={{
														display: 'inline-flex',
														alignItems: 'center',
														gap: 0.5,
														color: 'primary.main',
													}}
												>
													Ergebnisse
													<OpenInNewIcon sx={{ fontSize: '0.875rem' }} />
												</MuiLink>
											) : null}

											{item.ErgebnisText ? (
												<Tooltip title={isExpanded ? 'Einklappen' : 'Ausklappen'}>
													<IconButton
														size='small'
														onClick={() => handleToggleResultText(item.documentId)}
														aria-label='Ergebnistext ein-/ausklappen'
													>
														{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
													</IconButton>
												</Tooltip>
											) : null}
										</Box>
									</Box>

									{item.ErgebnisText && isExpanded ? (
										<Box sx={{ mt: 1 }}>
											<Typography
												variant='body2'
												sx={{
													color: 'text.secondary',
													whiteSpace: 'pre-wrap',
												}}
												dangerouslySetInnerHTML={{ __html: renderResultText(item.ErgebnisText) }}
											/>
										</Box>
									) : null}
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

		</>
	)
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, Checkbox, FormControlLabel, FormGroup, Paper, IconButton, Button, Link as MuiLink, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import DownloadIcon from '@mui/icons-material/Download'
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
	// Berechne verfügbare Jahre und Standard-Jahr: aktuelles Jahr + 3 vorherige, ab Oktober: nächstes Jahr + 2 vorherige
	const { availableYears, defaultYear } = useMemo(() => {
		const now = new Date()
		const currentMonth = now.getMonth() + 1 // 1-12
		const currentYear = now.getFullYear()

		if (currentMonth >= 10) {
			// Ab Oktober: nächstes Jahr bis 2 vorherige Jahre
			return {
				availableYears: [currentYear + 1, currentYear, currentYear - 1, currentYear - 2],
				defaultYear: currentYear + 1,
			}
		} else {
			// Vor Oktober: aktuelles Jahr + 3 vorherige Jahre
			return {
				availableYears: [currentYear, currentYear - 1, currentYear - 2, currentYear - 3],
				defaultYear: currentYear,
			}
		}
	}, [])

	const [selectedYear, setSelectedYear] = useState<number>(defaultYear)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [selectedItemForModal, setSelectedItemForModal] = useState<CalendarItem | null>(null)

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
			setAllCalendarItems(itemsArray)
		} catch (err) {
			// Fehler beim Laden aller Items ignorieren
			setAllCalendarItems([])
		}
	}, [strapiBaseUrl, selectedCalendarIds])

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

			// Region-Filter hinzufügen, falls ausgewählt
			if (selectedRegion) {
				filterConditions.push({
					Region: {
						eq: selectedRegion,
					},
				})
			}

			// Jahr-Filter hinzufügen
			const yearStart = `${selectedYear}-01-01`
			const yearEnd = `${selectedYear}-12-31`
			filterConditions.push({
				Date: {
					gte: yearStart,
					lte: yearEnd,
				},
			})

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
	}, [strapiBaseUrl, selectedCalendarIds, selectedRegion, selectedYear])

	useEffect(() => {
		void loadCalendars()
	}, [loadCalendars])

	useEffect(() => {
		void loadAllCalendarItems()
	}, [loadAllCalendarItems])

	useEffect(() => {
		void loadCalendarItems()
	}, [loadCalendarItems])

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setSelectedItemForModal(null)
			}
		}

		if (selectedItemForModal) {
			window.addEventListener('keydown', handleEscape)
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}

		return () => {
			window.removeEventListener('keydown', handleEscape)
			document.body.style.overflow = 'unset'
		}
	}, [selectedItemForModal])

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

	const resolveDocumentUrl = useCallback((calendarDocument: CalendarItem['CalendarDocument']) => {
		if (!calendarDocument?.MediaFile?.url) {
			return null
		}
		const url = calendarDocument.MediaFile.url
		if (url.startsWith('http')) {
			return url
		}
		return strapiBaseUrl ? `${strapiBaseUrl}${url}` : url
	}, [strapiBaseUrl])

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
							<FormGroup>
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
									{calendars.map((calendar) => {
										const colors = getCalendarColors(calendar)
										return (
											<Box
												key={calendar.documentId}
												sx={{
													backgroundColor: colors.backgroundColor,
													borderRadius: 1,
													padding: '8px 12px',
													display: 'inline-flex',
												}}
											>
												<FormControlLabel
													control={
														<Checkbox
															checked={selectedCalendarIds.has(calendar.documentId)}
															onChange={() => handleCalendarToggle(calendar.documentId)}
														/>
													}
													label={calendar.Name ?? 'Unbenannter Kalender'}
													sx={{
														margin: 0,
														'& .MuiFormControlLabel-label': {
															fontSize: '0.875rem',
															color: colors.textColor,
															fontWeight: 500,
														},
													}}
												/>
											</Box>
										)
									})}
								</Box>
							</FormGroup>

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
									{/* Eine Zeile: Datum - Description - Links */}
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
										{/* Datum */}
										<Typography
											variant='subtitle1'
											sx={{
												fontWeight: 600,
												color: 'text.primary',
												flexShrink: 0,
											}}
										>
											{formatDate(item.Date)}
										</Typography>

										{/* Headline und Description nehmen den verfügbaren Platz ein */}
										<Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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

										{/* Links und Aktionen am rechten Ende */}
										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', flexShrink: 0 }}>
											{item.LongDescription ? (
												<Button
													variant='outlined'
													size='small'
													onClick={() => setSelectedItemForModal(item)}
													sx={{ textTransform: 'none' }}
												>
													Mehr Details
												</Button>
											) : null}

											{item.AnmeldeLink ? (
												<MuiLink
													href={item.AnmeldeLink}
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
													Anmeldung
													<OpenInNewIcon sx={{ fontSize: '0.875rem' }} />
												</MuiLink>
											) : null}

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

			{/* Modal für LongDescription */}
			{selectedItemForModal ? (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
					onClick={() => setSelectedItemForModal(null)}
				>
					<div
						className='relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl'
						onClick={(e) => e.stopPropagation()}
					>
						<IconButton
							onClick={() => setSelectedItemForModal(null)}
							aria-label='Schließen'
							sx={{
								position: 'absolute',
								right: 16,
								top: 16,
								zIndex: 10,
								backgroundColor: 'rgba(255, 255, 255, 0.9)',
								boxShadow: 2,
								'&:hover': {
									backgroundColor: 'white',
								},
							}}
						>
							<CloseIcon />
						</IconButton>

						<Box sx={{ p: 4 }}>
							{(() => {
								const modalCalendarColors = selectedItemForModal.calendar
									? getCalendarColors(selectedItemForModal.calendar)
									: null
								return (
									<Typography
										variant='h5'
										component='h2'
										sx={{
											mb: 2,
											fontWeight: 600,
											color: 'text.primary',
										}}
									>
										{formatDate(selectedItemForModal.Date)}
										{selectedItemForModal.calendar?.Name ? (
											<Typography
												component='span'
												variant='body2'
												sx={{
													ml: 2,
													px: 1.5,
													py: 0.5,
													bgcolor: modalCalendarColors?.backgroundColor ?? 'grey.300',
													color: modalCalendarColors?.textColor ?? 'white',
													borderRadius: 1,
													fontWeight: 500,
												}}
											>
												{selectedItemForModal.calendar.Name}
											</Typography>
										) : null}
									</Typography>
								)
							})()}

							{selectedItemForModal.LongDescription ? (
								<Typography
									variant='body1'
									sx={{
										color: 'text.secondary',
										whiteSpace: 'pre-wrap',
										mb: 2,
										'& p': {
											mb: 2,
										},
										'& p:last-child': {
											mb: 0,
										},
										'& a': {
											color: 'primary.main',
											textDecoration: 'none',
											'&:hover': {
												textDecoration: 'underline',
											},
										},
									}}
									dangerouslySetInnerHTML={{ __html: renderStrapiBlocks(selectedItemForModal.LongDescription) }}
								/>
							) : null}

							{/* Download-Link im Modal */}
							{selectedItemForModal.CalendarDocument?.MediaFile?.url ? (
								<Box sx={{ mt: 2 }}>
									<MuiLink
										href={resolveDocumentUrl(selectedItemForModal.CalendarDocument) ?? '#'}
										download
										underline='hover'
										sx={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: 0.5,
											color: 'primary.main',
										}}
									>
										<DownloadIcon sx={{ fontSize: '1rem' }} />
										Download
										{selectedItemForModal.CalendarDocument.MediaFile.name ? ` (${selectedItemForModal.CalendarDocument.MediaFile.name})` : ''}
									</MuiLink>
								</Box>
							) : null}
						</Box>
					</div>
				</div>
			) : null}
		</>
	)
}


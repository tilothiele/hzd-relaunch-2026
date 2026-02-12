import type { Calendar } from '@/types'

/**
 * Mappt ColorSchema Enumeration-Werte (vom GraphQL Backend) auf konkrete Farben
 */
export function getColorBySchema(colorSchema: Calendar['ColorSchema']): { backgroundColor: string; textColor: string } {
    if (!colorSchema) {
        return {
            backgroundColor: '#6b7280',
            textColor: '#ffffff',
        }
    }

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
        Hellgrau: {
            backgroundColor: '#d1d5db',
            textColor: '#000000',
        },
        Hellblau: {
            backgroundColor: '#3b82f6',
            textColor: '#ffffff',
        },
        Dunkelblau: {
            backgroundColor: '#1e3a8a',
            textColor: '#ffffff',
        },
        Orange: {
            backgroundColor: '#f97316',
            textColor: '#ffffff',
        },
    }

    const normalizedSchema = colorSchema.trim()
    if (colorMap[normalizedSchema]) {
        return colorMap[normalizedSchema]
    }

    // Fallback if specific schema not found but valid hex or color code provided
    const textColor = getContrastTextColor(colorSchema)
    return {
        backgroundColor: colorSchema,
        textColor,
    }
}

/**
 * Weist jedem Kalender Hintergrund- und Textfarbe basierend auf ColorSchema Enumeration zu
 */
export function getCalendarColors(calendar: Calendar): { backgroundColor: string; textColor: string } {
    return getColorBySchema(calendar.ColorSchema)
}

/**
 * Bestimmt die passende Textfarbe basierend auf der Helligkeit der Hintergrundfarbe
 */
export function getContrastTextColor(backgroundColor: string): string {
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Relative luminance calculation
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Formatiert ein Datum für die Anzeige
 */
export function formatDate(dateString: string | null | undefined): string {
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
}

/**
 * Formatiert eine Zeit für die Anzeige
 */
export function formatTime(timeString: string | null | undefined): string {
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
}

/**
 * Formatiert einen Datumsbereich für die Anzeige
 */
export function formatDateRange(
    date: string | null | undefined,
    time: string | null | undefined,
    dateTo: string | null | undefined,
): string {
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
}

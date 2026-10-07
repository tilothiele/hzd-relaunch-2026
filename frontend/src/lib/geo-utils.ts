export function readCoordinate(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value)
		if (Number.isFinite(parsed)) {
			return parsed
		}
	}
	return null
}

export function readPosition(
	lat: unknown,
	lng: unknown,
): { lat: number; lng: number } | null {
	const latitude = readCoordinate(lat)
	const longitude = readCoordinate(lng)
	if (latitude === null || longitude === null) {
		return null
	}
	return { lat: latitude, lng: longitude }
}

/**
 * Berechnet die Entfernung zwischen zwei Koordinaten in Kilometern (Haversine-Formel)
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Erdradius in Kilometern
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

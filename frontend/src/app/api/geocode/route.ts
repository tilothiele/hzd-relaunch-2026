import { NextRequest, NextResponse } from 'next/server'

/**
 * API-Route zur Geocodierung einer PLZ zu Koordinaten
 * Verwendet Nominatim (OpenStreetMap) für kostenlose Geocoding
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const zip = searchParams.get('zip')

		if (!zip || zip.trim().length === 0) {
			return NextResponse.json({
				success: false,
				message: 'PLZ ist erforderlich',
			}, { status: 400 })
		}

		// Verwende Nominatim für Geocoding (kostenlos, OpenStreetMap)
		// Suche nach PLZ in Deutschland
		const query = `${zip.trim()}, Deutschland`
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=de`,
			{
				headers: {
					'Accept': 'application/json',
					'User-Agent': 'HZD-Frontend/1.0',
				},
			}
		)

		if (!response.ok) {
			throw new Error('Geocoding-Service nicht verfügbar')
		}

		const data = await response.json()

		if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
			return NextResponse.json({
				success: true,
				lat: parseFloat(data[0].lat),
				lng: parseFloat(data[0].lon),
				zip: zip.trim(),
			})
		}

		return NextResponse.json({
			success: false,
			message: 'PLZ konnte nicht geocodiert werden',
		})
	} catch (error) {
		console.error('Geocoding Error:', error)
		return NextResponse.json({
			success: false,
			message: error instanceof Error ? error.message : 'Geocoding konnte nicht durchgeführt werden',
		}, { status: 500 })
	}
}



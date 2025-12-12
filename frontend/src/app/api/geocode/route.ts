import { NextRequest, NextResponse } from 'next/server'

/**
 * Route muss dynamisch sein, da searchParams verwendet werden
 */
export const dynamic = 'force-dynamic'

/**
 * API-Route zur Geocodierung einer PLZ zu Koordinaten
 * Verwendet Nominatim (OpenStreetMap) für kostenlose Geocoding
 * Ergebnisse werden für 30 Tage gecacht
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
		// Suche spezifisch nach Postleitzahl in Deutschland
		// Caching aktiviert: Ergebnisse werden 30 Tage gecacht
		const zipCode = zip.trim()
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(zipCode)}&countrycodes=de&limit=1&addressdetails=1`,
			{
				headers: {
					'Accept': 'application/json',
					'User-Agent': 'HZD-Frontend/1.0',
				},
				next: {
					revalidate: 2592000, // 30 Tage Cache (in Sekunden)
				},
			}
		)

		if (!response.ok) {
			throw new Error('Geocoding-Service nicht verfügbar')
		}

		const data = await response.json()

		if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
			const result = data[0]
			// Validiere, dass die gefundene PLZ mit der gesuchten übereinstimmt
			const foundPostalCode = result.address?.postcode || result.address?.postal_code
			if (foundPostalCode && foundPostalCode !== zipCode) {
				// PLZ stimmt nicht überein - möglicherweise falsches Ergebnis
				return NextResponse.json({
					success: false,
					message: `PLZ ${zipCode} konnte nicht eindeutig gefunden werden`,
				})
			}

			return NextResponse.json({
				success: true,
				lat: parseFloat(result.lat),
				lng: parseFloat(result.lon),
				zip: zipCode,
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



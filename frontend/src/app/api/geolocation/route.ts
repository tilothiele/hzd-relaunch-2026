import { NextRequest, NextResponse } from 'next/server'

/**
 * API-Route zur Ermittlung der Geolocation aus der IP-Adresse
 * Verwendet ip-api.com (kostenlos, keine API-Key erforderlich)
 */
export async function GET(request: NextRequest) {
	try {
		// Ermittle die IP-Adresse des Clients
		const forwarded = request.headers.get('x-forwarded-for')
		const realIp = request.headers.get('x-real-ip')
		const ip = forwarded?.split(',')[0] || realIp || request.ip || ''

		if (!ip || ip === '::1' || ip === '127.0.0.1') {
			// Lokale IP, verwende einen Fallback
			return NextResponse.json({
				success: false,
				message: 'Lokale IP-Adresse erkannt',
			})
		}

		// Verwende ip-api.com für Geolocation (inkl. PLZ)
		const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,lat,lon,zip`, {
			headers: {
				'Accept': 'application/json',
			},
		})

		if (!response.ok) {
			throw new Error('Geolocation-Service nicht verfügbar')
		}

		const data = await response.json()

		if (data.status === 'success' && data.lat && data.lon) {
			return NextResponse.json({
				success: true,
				lat: data.lat,
				lng: data.lon,
				zip: data.zip || null,
			})
		}

		return NextResponse.json({
			success: false,
			message: data.message || 'Geolocation konnte nicht ermittelt werden',
		})
	} catch (error) {
		console.error('Geolocation Error:', error)
		return NextResponse.json({
			success: false,
			message: error instanceof Error ? error.message : 'Geolocation konnte nicht ermittelt werden',
		}, { status: 500 })
	}
}


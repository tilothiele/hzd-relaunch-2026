/**
 * Geolocation service
 * Provides geocoding functionality using OpenStreetMap Nominatim API
 */

import type { Core } from '@strapi/strapi'

export interface CacheEntry {
	lat: number
	lng: number
	timestamp: number
}

export interface GeoLocationResult {
	lat: number
	lng: number
}

// In-memory cache with 30 days TTL
const cache = new Map<string, CacheEntry>()
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

// Nominatim configuration (env overridable to avoid 403)
const NOMINATIM_BASE_URL =
	process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/search'
// Nominatim requires a descriptive User-Agent with contact info
const NOMINATIM_USER_AGENT =
	process.env.NOMINATIM_USER_AGENT || 'HZD-Backend/1.0 (contact@hzd-hovawarte.de)'
// Optional email hint to improve acceptance
const NOMINATIM_EMAIL = process.env.NOMINATIM_EMAIL
// Optional artificial delay (ms) to be nicer to the service
const NOMINATIM_DELAY_MS = Number(process.env.NOMINATIM_DELAY_MS || 0)

/**
 * Get geolocation by ZIP code using OpenStreetMap Nominatim API
 * Results are cached for 30 days
 */
async function getGeoLocationByZip(zip: string): Promise<GeoLocationResult | null> {
	if (!zip || zip.trim().length === 0) {
		return null
	}

	const zipKey = zip.trim().toUpperCase()

	// Check cache first
	const cached = cache.get(zipKey)
	if (cached) {
		const age = Date.now() - cached.timestamp
		if (age < CACHE_TTL) {
			return { lat: cached.lat, lng: cached.lng }
		}
		// Cache expired, remove it
		cache.delete(zipKey)
	}

	try {
		// Be gentle if a delay is configured
		if (NOMINATIM_DELAY_MS > 0) {
			await new Promise((resolve) => setTimeout(resolve, NOMINATIM_DELAY_MS))
		}

		// Use Nominatim API to geocode ZIP code
		// We search for the ZIP code in Germany (countrycode=de)
		const searchParams = new URLSearchParams({
			postalcode: zipKey,
			countrycodes: 'de',
			format: 'json',
			limit: '1',
		})
		if (NOMINATIM_EMAIL) {
			searchParams.set('email', NOMINATIM_EMAIL)
		}
		const url = `${NOMINATIM_BASE_URL}?${searchParams.toString()}`

		const response = await fetch(url, {
			headers: {
				'User-Agent': NOMINATIM_USER_AGENT, // required by Nominatim
				Accept: 'application/json',
			},
		})

		if (!response.ok) {
			console.error(`[Geolocation Service] HTTP error! status: ${response.status}`)
			return null
		}

		const data = await response.json()

		if (!Array.isArray(data) || data.length === 0) {
			console.warn(`[Geolocation Service] No results found for ZIP: ${zipKey}`)
			return null
		}

		const result = data[0]
		const lat = parseFloat(result.lat)
		const lng = parseFloat(result.lon)

		if (isNaN(lat) || isNaN(lng)) {
			console.error(`[Geolocation Service] Invalid coordinates for ZIP: ${zipKey}`)
			return null
		}

		// Cache the result
		cache.set(zipKey, {
			lat,
			lng,
			timestamp: Date.now(),
		})

		return { lat, lng }
	} catch (error) {
		console.error(`[Geolocation Service] Error fetching geolocation for ZIP ${zipKey}:`, error)
		return null
	}
}

/**
 * Clear expired cache entries
 * Should be called periodically to prevent memory leaks
 */
function clearExpiredCache(): void {
	const now = Date.now()
	for (const [key, entry] of cache.entries()) {
		if (now - entry.timestamp >= CACHE_TTL) {
			cache.delete(key)
		}
	}
}

export interface GeolocationService {
	getGeoLocationByZip: (zip: string) => Promise<GeoLocationResult | null>
	clearExpiredCache: () => void
}

export default ({ strapi }: { strapi: Core.Strapi }): GeolocationService => {
	// Clear expired cache entries every hour
	setInterval(clearExpiredCache, 60 * 60 * 1000)

	return {
		getGeoLocationByZip,
		clearExpiredCache,
	}
}


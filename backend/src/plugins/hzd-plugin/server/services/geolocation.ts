/**
 * Geolocation service
 * Provides geocoding functionality using OpenStreetMap Nominatim API
 * 
 * This service queries OpenStreetMap's Nominatim API to get latitude and longitude
 * coordinates for German postal codes (PLZ).
 * 
 * It caches results in the `plugin::hzd-plugin.geo-location` collection to persist data.
 * 
 * @see docs/NOMINATIM.md for configuration and environment variables documentation
 * @see https://nominatim.org/release-docs/latest/api/Usage-Policy/ for usage policy
 */

import type { Core } from '@strapi/strapi'
import Bottleneck from 'bottleneck';

export interface GeoLocationResult {
	lat: number
	lng: number
}

// Nominatim configuration (env overridable to avoid 403)
const NOMINATIM_BASE_URL =
	process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/search'
// Nominatim requires a descriptive User-Agent with contact info
const NOMINATIM_USER_AGENT =
	process.env.NOMINATIM_USER_AGENT || 'HZD-Backend/1.0 (contact@hzd-hovawarte.de)'
// Optional email hint to improve acceptance
const NOMINATIM_EMAIL = process.env.NOMINATIM_EMAIL
// Optional artificial delay (ms) to be nicer to the service (recommended: 1000ms)
const NOMINATIM_DELAY_MS = Number(process.env.NOMINATIM_DELAY_MS || 1000)

// Create a rate limiter to ensure we don't hit Nominatim too hard
// Nominatim usage policy requires max 1 request per second
const limiter = new Bottleneck({
	minTime: NOMINATIM_DELAY_MS,
	maxConcurrent: 1, // Strictly one request at a time
});

/**
 * Get geolocation by ZIP code using OpenStreetMap Nominatim API
 * Results are cached in the database
 * 
 * @param zip - Postal code
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g. 'DE', 'AT', 'CH')
 * @returns Promise with lat/lng coordinates or null if not found
 */
async function getGeoLocationByZip(zip: string, countryCode: string): Promise<GeoLocationResult | null> {
	if (!zip || zip.trim().length === 0 || !countryCode || countryCode.trim().length === 0) {
		return null
	}

	const cleanZip = zip.trim();
	const cleanCountry = countryCode.trim().toUpperCase();
	const zipKey = `${cleanCountry}-${cleanZip}`
	const uid = 'plugin::hzd-plugin.geo-location';

	// Check DB cache first
	try {
		const cachedEntries = await strapi.documents(uid).findMany({
			filters: { Key: zipKey },
			limit: 1
		});

		if (cachedEntries && cachedEntries.length > 0) {
			const cached = cachedEntries[0];
			console.log(`[Geolocation Service] DB Cache hit for: ${zipKey}`);
			return { lat: Number(cached.lat), lng: Number(cached.lng) };
		}
	} catch (dbError) {
		console.error(`[Geolocation Service] Error reading from DB cache:`, dbError);
	}

	// Schedule the API call through the rate limiter
	return limiter.schedule(async () => {
		try {
			// Use Nominatim API to geocode ZIP code
			const searchParams = new URLSearchParams({
				postalcode: cleanZip,
				countrycodes: cleanCountry.toLowerCase(),
				format: 'json',
				limit: '1',
				addressdetails: '0', // We only need coordinates
			})
			if (NOMINATIM_EMAIL) {
				searchParams.set('email', NOMINATIM_EMAIL)
			}
			const url = `${NOMINATIM_BASE_URL}?${searchParams.toString()}`

			console.log(`[Geolocation Service] Fetching geolocation for: ${zipKey}`)

			const response = await fetch(url, {
				headers: {
					'User-Agent': NOMINATIM_USER_AGENT, // required by Nominatim
					Accept: 'application/json',
				},
			})

			if (!response.ok) {
				console.error(`[Geolocation Service] HTTP error! status: ${response.status} for: ${zipKey}`)
				return null
			}

			const data = await response.json()

			console.log(`[Geolocation Service] Response for ${zipKey}:`, data);

			if (!Array.isArray(data) || data.length === 0) {
				console.warn(`[Geolocation Service] No results found for: ${zipKey}`)
				return null
			}

			const result = data[0]
			const lat = parseFloat(result.lat)
			const lng = parseFloat(result.lon)

			if (isNaN(lat) || isNaN(lng)) {
				console.error(`[Geolocation Service] Invalid coordinates for: ${zipKey}`, { lat: result.lat, lon: result.lon })
				return null
			}

			// Cache the result in DB
			try {
				await strapi.documents(uid).create({
					data: {
						Key: zipKey,
						lat,
						lng
					},
					status: 'published'
				});
			} catch (saveError) {
				console.error(`[Geolocation Service] Error saving to DB cache:`, saveError);
			}

			console.log(`[Geolocation Service] Successfully geocoded and cached: ${zipKey} -> lat: ${lat}, lng: ${lng}`)

			return { lat, lng }
		} catch (error) {
			console.error(`[Geolocation Service] Error fetching geolocation for ${zipKey}:`, error)
			return null
		}
	});
}

/**
 * Clear expired cache entries
 * NO-OP for now as we persist indefinitely in DB or until manual cleanup
 * Can be implemented if we add a 'timestamp' field to the schema later.
 */
function clearExpiredCache(): void {
	// Implementation deferred
}

export interface GeolocationService {
	getGeoLocationByZip: (zip: string, countryCode: string) => Promise<GeoLocationResult | null>
	clearExpiredCache: () => void
}

export default ({ strapi }: { strapi: Core.Strapi }): GeolocationService => {
	return {
		getGeoLocationByZip,
		clearExpiredCache,
	}
}


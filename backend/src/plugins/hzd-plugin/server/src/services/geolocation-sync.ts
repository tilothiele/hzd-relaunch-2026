/**
 * Geolocation Sync Service
 *
 * Cronjob service that:
 * 1. Finds breeders with Address.Zip but no Address coordinates and sets them
 * 2. Finds users with ZIP but no GeoLocation and sets it
 * 3. Finds dogs without Location and sets it from their breeder's Address
 *
 * The job is idempotent and uses a lock to prevent concurrent execution.
 */

import type { Core } from '@strapi/strapi'

// Lock flag to prevent concurrent execution
let isRunning = false
let lastRunTime: Date | null = null
let lastRunDuration: number | null = null

/**
 * Sync geolocation for users with ZIP but no GeoLocation
 */
async function syncUserGeolocations(strapi: Core.Strapi): Promise<void> {
	// Find all users with ZIP but no GeoLocation at once
	const allUsers = await strapi.query('plugin::users-permissions.user').findMany({
		// No populate needed for scalar locationLat/locationLng
	})

	// Filter users that have ZIP but no GeoLocation
	const usersToProcess = allUsers.filter((u) => {
		const hasZip = u.zip && u.zip.trim().length > 0
		const hasNoGeo = !u.locationLat || !u.locationLng
		return hasZip && hasNoGeo
	})

	strapi.log.info(`[Geolocation Sync] Found ${usersToProcess.length} users with ZIP but no GeoLocation`)

	// Get geolocation service
	const geolocationService = strapi.plugin('hzd-plugin')?.service('geolocation')
	if (!geolocationService) {
		strapi.log.error('[Geolocation Sync] Geolocation service not available, skipping user processing')
		return
	}

	let usersProcessed = 0
	let usersFailed = 0

	// Process each user
	for (const user of usersToProcess) {
		const zip = user.zip.trim()
		strapi.log.info(`[Geolocation Sync] Processing user ${user.id} with ZIP: ${zip}`)


		// Fetch geolocation
		const countryCode = user.countryCode === 'D' || !user.countryCode ? 'DE' : user.countryCode
		const geoResult = await geolocationService.getGeoLocationByZip(zip, countryCode)

		if (geoResult) {
			// Update user with GeoLocation
			await strapi.documents('plugin::users-permissions.user').update({
				documentId: user.documentId,
				data: {
					locationLat: geoResult.lat,
					locationLng: geoResult.lng,
				} as any,
			})

			strapi.log.info(`[Geolocation Sync] ✓ Set GeoLocation for user ${user.id}: lat=${geoResult.lat}, lng=${geoResult.lng}`)
			usersProcessed++
		} else {
			strapi.log.warn(`[Geolocation Sync] ✗ Could not fetch geolocation for ZIP: ${zip} (user ${user.id})`)
			usersFailed++
		}

		// Small delay to be nice to the API
		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	strapi.log.info(`[Geolocation Sync] Processed ${usersProcessed} users successfully, ${usersFailed} failed`)
}

function breederCountryCode(countryCode: unknown): string {
	if (typeof countryCode !== 'string' || countryCode.trim() === '' || countryCode === 'D') {
		return 'DE'
	}
	return countryCode
}

/**
 * Sync geolocation for breeders with Address.Zip but no Address coordinates
 */
async function syncBreederAddressGeolocations(strapi: Core.Strapi): Promise<void> {
	const breeders = await strapi.query('plugin::hzd-plugin.breeder').findMany({
		populate: {
			Address: true,
		},
	})

	const breedersToProcess = breeders.filter((breeder) => {
		const zip = typeof breeder.Address?.Zip === 'string' ? breeder.Address.Zip.trim() : ''
		const hasNoGeo = !breeder.Address?.locationLat || !breeder.Address?.locationLng
		return zip.length > 0 && hasNoGeo
	})

	strapi.log.info(`[Geolocation Sync] Found ${breedersToProcess.length} breeders with ZIP but no Address coordinates`)

	const geolocationService = strapi.plugin('hzd-plugin')?.service('geolocation')
	if (!geolocationService) {
		strapi.log.error('[Geolocation Sync] Geolocation service not available, skipping breeder processing')
		return
	}

	let breedersProcessed = 0
	let breedersFailed = 0

	for (const breeder of breedersToProcess) {
		const address = breeder.Address
		const zip = address.Zip.trim()
		strapi.log.info(`[Geolocation Sync] Processing breeder ${breeder.id} with ZIP: ${zip}`)

		const geoResult = await geolocationService.getGeoLocationByZip(
			zip,
			breederCountryCode(address.CountryCode),
		)

		if (geoResult) {
			await strapi.documents('plugin::hzd-plugin.breeder').update({
				documentId: breeder.documentId,
				data: {
					Address: {
						FullName: address.FullName,
						Address1: address.Address1,
						Address2: address.Address2,
						CountryCode: address.CountryCode,
						Zip: address.Zip,
						City: address.City,
						locationLat: geoResult.lat,
						locationLng: geoResult.lng,
					},
				} as any,
			})

			strapi.log.info(`[Geolocation Sync] ✓ Set Address coordinates for breeder ${breeder.id}: lat=${geoResult.lat}, lng=${geoResult.lng}`)
			breedersProcessed++
		} else {
			strapi.log.warn(`[Geolocation Sync] ✗ Could not fetch geolocation for ZIP: ${zip} (breeder ${breeder.id})`)
			breedersFailed++
		}

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	strapi.log.info(`[Geolocation Sync] Processed ${breedersProcessed} breeders successfully, ${breedersFailed} failed`)
}

/**
 * Main sync job function
 */
async function syncGeolocations(strapi: Core.Strapi): Promise<void> {
	// Check lock
	if (isRunning) {
		strapi.log.warn('[Geolocation Sync] Job already running, skipping this execution')
		return
	}

	// Acquire lock
	isRunning = true
	const startTime = Date.now()

	try {
		strapi.log.info('[Geolocation Sync] Starting geolocation sync job')

		await syncBreederAddressGeolocations(strapi)
		await syncUserGeolocations(strapi)

		// Step 4-5: Process dogs without Location
		// Get all dogs and filter for those without Location
		const allDogs = await strapi.query('plugin::hzd-plugin.dog').findMany({
			populate: {
				breeder: {
					populate: {
						Address: true,
					},
				},
				Location: true,
			},
			limit: 100, // Process in batches
		})

		// Filter dogs without Location
		const dogs = allDogs.filter((dog) => {
			return !dog.Location || !dog.Location.lat || !dog.Location.lng
		})

		strapi.log.info(`[Geolocation Sync] Found ${dogs.length} dogs without Location`)

		let dogsProcessed = 0
		for (const dog of dogs) {
			const address = dog.breeder?.Address
			if (!address?.locationLat || !address?.locationLng) {
				strapi.log.debug(`[Geolocation Sync] Dog ${dog.id} has no breeder address coordinates, skipping`)
				continue
			}

			await strapi.documents('plugin::hzd-plugin.dog').update({
				documentId: dog.documentId,
				data: {
					Location: {
						lat: address.locationLat,
						lng: address.locationLng,
					},
				} as any,
			})

			strapi.log.info(`[Geolocation Sync] ✓ Set Location for dog ${dog.id} from breeder ${dog.breeder.id}`)
			dogsProcessed++
		}

		strapi.log.info(`[Geolocation Sync] Processed ${dogsProcessed} dogs`)

		const duration = Date.now() - startTime
		lastRunTime = new Date()
		lastRunDuration = duration

		strapi.log.info(`[Geolocation Sync] Job completed successfully in ${duration}ms`)
	} catch (error) {
		strapi.log.error('[Geolocation Sync] Error in sync job:', error)
		throw error
	} finally {
		// Release lock
		isRunning = false
	}
}

/**
 * Get job status
 */
function getStatus() {
	return {
		isRunning,
		lastRunTime,
		lastRunDuration,
	}
}

export interface GeolocationSyncService {
	syncGeolocations: () => Promise<void>
	getStatus: () => { isRunning: boolean; lastRunTime: Date | null; lastRunDuration: number | null }
}

export default ({ strapi }: { strapi: Core.Strapi }): GeolocationSyncService => {
	return {
		syncGeolocations: () => syncGeolocations(strapi),
		getStatus,
	}
}


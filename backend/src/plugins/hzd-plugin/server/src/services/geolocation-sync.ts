/**
 * Geolocation Sync Service
 *
 * Cronjob service that:
 * 1. Finds breeders with ZIP but no GeoLocation and sets it
 * 2. Finds users with ZIP but no GeoLocation and sets it
 * 3. Finds dogs without Location and sets it from their breeder's GeoLocation
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
		populate: {
			geoLocation: true,
		},
	})

	// Filter users that have ZIP but no GeoLocation
	const usersToProcess = allUsers.filter((u) => {
		const hasZip = u.zip && u.zip.trim().length > 0
		const hasNoGeo = !u.geoLocation || !u.geoLocation.lat || !u.geoLocation.lng
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
					geoLocation: {
						lat: geoResult.lat,
						lng: geoResult.lng,
					},
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

		// Step 1-3: Process breeders with ZIP but no GeoLocation
		let breedersProcessed = 0
		let maxIterations = 1000 // Safety limit to prevent infinite loops
		let iteration = 0

		while (iteration < maxIterations) {
			iteration++

			// Find breeders with Address populated
			// We'll filter for those without GeoLocation and with ZIP in the code
			const breeders = await strapi.query('plugin::hzd-plugin.breeder').findMany({
				populate: {
					Address: true,
					GeoLocation: true,
				},
				limit: 100, // Get a batch to filter
			})

			// Filter breeders that have ZIP but no GeoLocation
			const breederWithZip = breeders.find((b) => {
				const address = b.Address
				const hasZip = address && address.Zip && address.Zip.trim().length > 0
				const hasNoGeo = !b.GeoLocation || !b.GeoLocation.lat || !b.GeoLocation.lng
				return hasZip && hasNoGeo
			})

			if (!breederWithZip) {
				strapi.log.info('[Geolocation Sync] No more breeders with ZIP but no GeoLocation found')
				break
			}

			const zip = breederWithZip.Address.Zip.trim()
			strapi.log.info(`[Geolocation Sync] Processing breeder ${breederWithZip.id} with ZIP: ${zip}`)

			// Get geolocation service
			const geolocationService = strapi.plugin('hzd-plugin')?.service('geolocation')
			if (!geolocationService) {
				strapi.log.error('[Geolocation Sync] Geolocation service not available')
				break
			}

			// Fetch geolocation
			let countryCode = breederWithZip.Address.CountryCode
			if (!countryCode || countryCode === 'D') {
				countryCode = 'DE'
			}
			const geoResult = await geolocationService.getGeoLocationByZip(zip, countryCode)

			if (geoResult) {
				// Update breeder with GeoLocation
				await strapi.documents('plugin::hzd-plugin.breeder').update({
					documentId: breederWithZip.documentId,
					data: {
						GeoLocation: {
							lat: geoResult.lat,
							lng: geoResult.lng,
						},
					} as any,
				})

				strapi.log.info(`[Geolocation Sync] ✓ Set GeoLocation for breeder ${breederWithZip.id}: lat=${geoResult.lat}, lng=${geoResult.lng}`)
				breedersProcessed++
			} else {
				strapi.log.warn(`[Geolocation Sync] ✗ Could not fetch geolocation for ZIP: ${zip} (breeder ${breederWithZip.id})`)
				// Continue with next breeder even if this one failed
			}

			// Small delay to be nice to the API
			await new Promise((resolve) => setTimeout(resolve, 100))
		}

		if (iteration >= maxIterations) {
			strapi.log.warn(`[Geolocation Sync] Reached max iterations (${maxIterations}), stopping breeder processing`)
		}

		strapi.log.info(`[Geolocation Sync] Processed ${breedersProcessed} breeders`)

		// Step 3.5: Process users with ZIP but no GeoLocation
		await syncUserGeolocations(strapi)

		// Step 4-5: Process dogs without Location
		// Get all dogs and filter for those without Location
		const allDogs = await strapi.query('plugin::hzd-plugin.dog').findMany({
			populate: {
				breeder: {
					populate: {
						GeoLocation: true,
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
			if (!dog.breeder || !dog.breeder.GeoLocation) {
				strapi.log.debug(`[Geolocation Sync] Dog ${dog.id} has no breeder or breeder has no GeoLocation, skipping`)
				continue
			}

			const geoLocation = dog.breeder.GeoLocation

			// Update dog with Location from breeder
			await strapi.documents('plugin::hzd-plugin.dog').update({
				documentId: dog.documentId,
				data: {
					Location: {
						lat: geoLocation.lat,
						lng: geoLocation.lng,
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


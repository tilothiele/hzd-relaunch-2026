/**
 *  service
 */

import type { Core } from '@strapi/strapi'
import { factories } from '@strapi/strapi'

const coreService = factories.createCoreService('plugin::hzd-plugin.dog')

// Haversine-Formel für Distanzberechnung
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
	const R = 6371 // Erdradius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLon = ((lon2 - lon1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
	const service = coreService({ strapi })

	return {
		...service,
		async find(ctx: any) {
			const { lat, lng, maxDistance, ...restQuery } = ctx.query

			// Wenn keine Geolocation-Parameter, normale Suche
			if (!lat || !lng) {
				return (service as any).find(ctx)
			}

			// Extrahiere normale Filter aus Query
			const { filters, populate, sort, pagination } = restQuery

			// Erstelle Query-Objekt für normale Filter
			const queryParams: any = {
				populate: populate || ['Location', 'avatar', 'owner'],
				sort: sort || 'createdAt:desc',
			}

			// Füge Filter hinzu, wenn vorhanden
			if (filters) {
				queryParams.filters = filters
			}

			// Für Distanzabfrage: Erst alle Ergebnisse abrufen (oder mit grober Bounding-Box vorfiltern)
			// Dann in JavaScript nach Distanz filtern
			// Für bessere Performance: Erhöhe pageSize temporär, wenn keine Pagination angegeben
			if (!pagination) {
				queryParams.pagination = { pageSize: 1000 } // Oder ein angemessener Wert
			} else {
				queryParams.pagination = pagination
			}

			// Führe normale Strapi-Query aus
			const result = await strapi.entityService.findPage('plugin::hzd-plugin.dog', queryParams)

			// Parse Geolocation-Parameter
			const searchLat = parseFloat(lat as string)
			const searchLng = parseFloat(lng as string)
			const maxDist = maxDistance ? parseFloat(maxDistance as string) : 100

			// Filtere nach Distanz und füge Distanz hinzu
			const filteredResults = result.results
				.filter((dog: any) => {
					if (!dog.Location || dog.Location.lat === null || dog.Location.lng === null) {
						return false
					}
					const distance = calculateDistance(
						searchLat,
						searchLng,
						parseFloat(dog.Location.lat),
						parseFloat(dog.Location.lng)
					)
					// Füge Distanz zum Objekt hinzu
					dog.distance = Math.round(distance * 100) / 100
					return distance <= maxDist
				})
				.sort((a: any, b: any) => a.distance - b.distance) // Sortiere nach Distanz

			// Wenn Pagination angegeben war, wende sie auf gefilterte Ergebnisse an
			if (pagination) {
				const page = parseInt(pagination.page as string) || 1
				const pageSize = parseInt(pagination.pageSize as string) || 25
				const startIndex = (page - 1) * pageSize
				const endIndex = startIndex + pageSize
				const paginatedResults = filteredResults.slice(startIndex, endIndex)

				return {
					data: paginatedResults,
					meta: {
						pagination: {
							page,
							pageSize,
							pageCount: Math.ceil(filteredResults.length / pageSize),
							total: filteredResults.length,
						},
					},
				}
			}

			return {
				data: filteredResults,
				meta: {
					pagination: {
						page: 1,
						pageSize: filteredResults.length,
						pageCount: 1,
						total: filteredResults.length,
					},
				},
			}
		},
	}
}

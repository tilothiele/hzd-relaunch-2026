'use client'

import { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import type { Dog } from '@/types'

// Dynamischer Import der Karte für SSR-Kompatibilität
const MapContainer = dynamic(
	() => import('react-leaflet').then((mod) => mod.MapContainer),
	{ ssr: false }
)
const TileLayer = dynamic(
	() => import('react-leaflet').then((mod) => mod.TileLayer),
	{ ssr: false }
)
const Marker = dynamic(
	() => import('react-leaflet').then((mod) => mod.Marker),
	{ ssr: false }
)
const Popup = dynamic(
	() => import('react-leaflet').then((mod) => mod.Popup),
	{ ssr: false }
)
const Tooltip = dynamic(
	() => import('react-leaflet').then((mod) => mod.Tooltip),
	{ ssr: false }
)

// Fix für Leaflet-Icons in Next.js
if (typeof window !== 'undefined') {
	import('leaflet').then((L) => {
		delete (L.default.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
		L.default.Icon.Default.mergeOptions({
			iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
			iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
			shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
		})
	})
}

interface DogMapProps {
	isVisible: boolean
	dogs: Dog[]
}

// Deutschland Zentrum
const GERMANY_CENTER: [number, number] = [51.1657, 10.4515]
const GERMANY_ZOOM = 6

// Deutschland grobe Grenzen: Lat 47-55, Lon 5-15
const GERMANY_BOUNDS = {
	minLat: 47.0,
	maxLat: 55.0,
	minLng: 5.0,
	maxLng: 15.0,
}

/**
 * Generiert zufällige Koordinaten innerhalb oder sehr nah bei Deutschland
 */
function generateRandomLocationInGermany(): [number, number] {
	const lat = GERMANY_BOUNDS.minLat + Math.random() * (GERMANY_BOUNDS.maxLat - GERMANY_BOUNDS.minLat)
	const lng = GERMANY_BOUNDS.minLng + Math.random() * (GERMANY_BOUNDS.maxLng - GERMANY_BOUNDS.minLng)
	return [lat, lng]
}

/**
 * Erstellt Marker-Daten aus Hunde-Daten
 */
function createMarkersFromDogs(dogs: Dog[]): Array<{ id: string; position: [number, number]; name: string; dog: Dog }> {
	return dogs.map((dog) => {
		let position: [number, number]

		if (dog.Location?.lat && dog.Location?.lng) {
			position = [dog.Location.lat, dog.Location.lng]
		} else {
			// Generiere zufällige Position in Deutschland, wenn keine Location vorhanden
			position = generateRandomLocationInGermany()
		}

		const fullName = dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'

		return {
			id: dog.documentId,
			position,
			name: fullName,
			dog,
		}
	})
}

export function DogMap({ isVisible, dogs }: DogMapProps) {
	const [isMounted, setIsMounted] = useState(false)
	const markers = useMemo(() => createMarkersFromDogs(dogs), [dogs])

	useEffect(() => {
		setIsMounted(true)
	}, [])

	if (!isVisible || !isMounted) {
		return null
	}

	return (
		<div className='mb-6 h-96 w-full overflow-hidden rounded-lg border border-gray-200 shadow-md'>
			<MapContainer
				center={GERMANY_CENTER}
				zoom={GERMANY_ZOOM}
				style={{ height: '100%', width: '100%' }}
				scrollWheelZoom={true}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
				/>
				{markers.map((marker) => (
					<Marker key={marker.id} position={marker.position}>
						<Tooltip permanent={false}>
							{marker.name}
						</Tooltip>
						<Popup>
							<div>
								<strong>{marker.name}</strong>
								{marker.dog.givenName && marker.dog.fullKennelName ? (
									<div>{marker.dog.givenName}</div>
								) : null}
							</div>
						</Popup>
					</Marker>
				))}
			</MapContainer>
		</div>
	)
}


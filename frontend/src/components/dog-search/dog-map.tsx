'use client'

import { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

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
}

// Deutschland Zentrum
const GERMANY_CENTER: [number, number] = [51.1657, 10.4515]
const GERMANY_ZOOM = 6

// Generiere 10 zufällige Marker in Deutschland
function generateRandomMarkers(count: number): Array<{ id: number; position: [number, number]; name: string }> {
	const markers: Array<{ id: number; position: [number, number]; name: string }> = []
	
	// Deutschland grobe Grenzen: Lat 47-55, Lon 5-15
	for (let i = 0; i < count; i++) {
		const lat = 47 + Math.random() * 8 // 47-55
		const lon = 5 + Math.random() * 10 // 5-15
		markers.push({
			id: i + 1,
			position: [lat, lon],
			name: `Hund ${i + 1}`,
		})
	}
	
	return markers
}

export function DogMap({ isVisible }: DogMapProps) {
	const [isMounted, setIsMounted] = useState(false)
	const markers = useMemo(() => generateRandomMarkers(10), [])

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
						<Popup>
							{marker.name}
						</Popup>
					</Marker>
				))}
			</MapContainer>
		</div>
	)
}


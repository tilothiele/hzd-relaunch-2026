'use client'

import { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'
import type { Dog } from '@/types'
import type L from 'leaflet'
import { useCookieConsent } from '@/hooks/use-cookie-consent'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { useGlobalLayout } from '@/hooks/use-global-layout'

type LeafletIcon = InstanceType<typeof L.Icon>

// Dynamischer Import der Karte für SSR-Kompatibilität
// Diese werden erst geladen, wenn sie tatsächlich gerendert werden (dank Next.js dynamic)
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

interface DogMapProps {
	isVisible: boolean
	dogs: Dog[]
	userLocation?: { lat: number; lng: number } | null
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

// Komponente für Benutzerposition-Marker
function UserLocationMarker({ position, icon }: { position: [number, number]; icon: LeafletIcon }) {
	return (
		<Marker position={position} icon={icon}>
			<Tooltip permanent={false}>Ihre Position (PLZ)</Tooltip>
		</Marker>
	)
}

// Komponente, die prüft, ob die Map bereit ist
function MapReady({ onReady }: { onReady: () => void }) {
	useEffect(() => {
		const timer = setTimeout(() => {
			onReady()
		}, 200)
		return () => clearTimeout(timer)
	}, [onReady])
	return null
}

export function DogMap({ isVisible, dogs, userLocation }: DogMapProps) {
	const [isMounted, setIsMounted] = useState(false)
	const [isMapReady, setIsMapReady] = useState(false)
	const [grayIcon, setGrayIcon] = useState<LeafletIcon | null>(null)
	const { isAccepted, accept } = useCookieConsent()
	const { globalLayout, baseUrl: globalBaseUrl } = useGlobalLayout()
	const markers = useMemo(() => createMarkersFromDogs(dogs), [dogs])

	const privacyPolicyUrl = resolveMediaUrl(globalLayout?.PrivacyPolicy ?? null, globalBaseUrl)

	useEffect(() => {
		setIsMounted(true)
	}, [])

	// Leaflet Icons fixen - erst NACH Consent und nur auf Client
	useEffect(() => {
		if (!isAccepted || typeof window === 'undefined') return

		const fixLeafletIcons = async () => {
			const LModule = await import('leaflet')
			const L = LModule.default

			// Fix für Default-Icons
			delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
			L.Icon.Default.mergeOptions({
				iconUrl: '/static-images/map/marker-icon.png',
				iconRetinaUrl: '/static-images/map/marker-icon-2x.png',
				shadowUrl: '/static-images/map/marker-shadow.png',
			})

			// Graues Icon für User-Location laden
			if (userLocation) {
				const icon = L.icon({
					iconUrl: '/static-images/map/marker-icon-grey.png',
					iconRetinaUrl: '/static-images/map/marker-icon-2x-grey.png',
					shadowUrl: '/static-images/map/marker-shadow.png',
					iconSize: [25, 41],
					iconAnchor: [12, 41],
					popupAnchor: [1, -34],
					shadowSize: [41, 41],
				})
				setGrayIcon(icon)
			}
		}

		void fixLeafletIcons()
	}, [isAccepted, userLocation])

	if (!isVisible || !isMounted) {
		return null
	}

	if (!isAccepted) {
		return (
			<div className='relative mb-6 h-96 w-full overflow-hidden rounded-lg border border-gray-200 shadow-md'>
				<div
					className='absolute inset-0 bg-gray-100'
					style={{
						backgroundImage: 'url("/static-images/map/blurred-map.png")',
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						filter: 'blur(1px)'
					}}
				/>
				<div className='absolute inset-0 flex flex-col items-center justify-center bg-white/60 p-6 text-center backdrop-blur-sm'>
					<h3 className='mb-2 text-xl font-bold text-gray-900'>Interaktive Karte</h3>
					<p className='mb-6 max-w-md text-sm text-gray-700'>
						Um die Karte anzuzeigen, akzeptieren Sie bitte die Cookies und Datenschutzbestimmungen.
						Dabei werden Daten von OpenStreetMap geladen.
					</p>
					<div className='flex flex-wrap items-center justify-center gap-4'>
						<button
							onClick={accept}
							className='rounded bg-yellow-400 px-6 py-2 text-sm font-semibold text-[#3d2817] transition-colors hover:bg-yellow-300'
						>
							Karte aktivieren & Cookies akzeptieren
						</button>
						{privacyPolicyUrl && (
							<Link
								href={privacyPolicyUrl}
								target='_blank'
								className='text-sm text-gray-600 underline hover:text-gray-900'
							>
								Datenschutzerklärung lesen
							</Link>
						)}
					</div>
				</div>
			</div>
		)
	}

	const userPosition: [number, number] | null = userLocation
		? [userLocation.lat, userLocation.lng]
		: null

	return (
		<div className='mb-6 h-96 w-full overflow-hidden rounded-lg border border-gray-200 shadow-md'>
			<MapContainer
				center={userPosition || GERMANY_CENTER}
				zoom={userPosition ? 8 : GERMANY_ZOOM}
				style={{ height: '100%', width: '100%' }}
				scrollWheelZoom={true}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
				/>
				<MapReady onReady={() => setIsMapReady(true)} />
				{userPosition && isMapReady && grayIcon && (
					<UserLocationMarker position={userPosition} icon={grayIcon} />
				)}
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

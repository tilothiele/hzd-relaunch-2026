'use client'

import { useMemo, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'
import { useCookieConsent } from '@/hooks/use-cookie-consent'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { useGlobalLayout } from '@/hooks/use-global-layout'
import { theme } from '@/themes'
import OpenWithIcon from '@mui/icons-material/OpenWith'

type LeafletIcon = InstanceType<typeof L.Icon>

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

// Wir importieren useMap normal, da es nur innerhalb von MapContainer verwendet wird,
// welcher selbst ssr: false ist.
import { useMap } from 'react-leaflet'

export interface MapItem {
    id: string
    position: [number, number]
    title: string
    popupContent?: ReactNode
}

interface HzdMapProps {
    isVisible: boolean
    items: MapItem[]
    userLocation?: { lat: number; lng: number } | null
    height?: string | number
}

// Deutschland Zentrum
const GERMANY_CENTER: [number, number] = [51.1657, 10.4515]
const GERMANY_ZOOM = 6

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

// Komponente zum Aktualisieren der Kartengröße bei Höhenänderung
function ResizeTrigger({ height }: { height: number }) {
    const map = useMap()
    useEffect(() => {
        if (map) {
            map.invalidateSize()
        }
    }, [height, map])
    return null
}

export function HzdMap({ isVisible, items, userLocation, height = '400px' }: HzdMapProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [isMapReady, setIsMapReady] = useState(false)
    const [grayIcon, setGrayIcon] = useState<LeafletIcon | null>(null)
    const [mapHeight, setMapHeight] = useState<number>(
        typeof height === 'string' ? parseInt(height) : height
    )
    const [isResizing, setIsResizing] = useState(false)
    const [isButtonHovered, setIsButtonHovered] = useState(false)
    const resizeStartRef = useRef<{ y: number; height: number } | null>(null)

    const { isAccepted, accept } = useCookieConsent()
    const { globalLayout, baseUrl: globalBaseUrl } = useGlobalLayout()

    const privacyPolicyUrl = resolveMediaUrl(globalLayout?.PrivacyPolicy ?? null, globalBaseUrl)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isResizing) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!resizeStartRef.current) return
            const deltaY = e.pageY - resizeStartRef.current.y
            const newHeight = Math.max(200, resizeStartRef.current.height + deltaY)
            setMapHeight(newHeight)
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            resizeStartRef.current = null
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
        resizeStartRef.current = {
            y: e.pageY,
            height: mapHeight
        }
    }, [mapHeight])

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
            <div
                className='relative mb-6 w-full overflow-hidden rounded-lg border border-gray-200 shadow-md'
                style={{ height: mapHeight }}
            >
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
                            className='rounded px-6 py-2 text-sm font-semibold transition-colors'
                            style={{
                                backgroundColor: theme.submitButtonColor,
                                color: theme.submitButtonTextColor,
                                filter: isButtonHovered ? 'brightness(90%)' : 'none',
                            }}
                            onMouseEnter={() => setIsButtonHovered(true)}
                            onMouseLeave={() => setIsButtonHovered(false)}
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
                {/* Resize Handle auch im Blur-Modus */}
                <div
                    onMouseDown={startResizing}
                    className='absolute bottom-0 right-0 z-[1001] flex h-6 w-6 cursor-ns-resize items-center justify-center rounded-tl bg-white/80 shadow-sm transition-colors hover:bg-yellow-400'
                    title='Höhe ändern'
                >
                    <OpenWithIcon sx={{ fontSize: 14, transform: 'rotate(45deg)', color: '#3d2817' }} />
                </div>
            </div>
        )
    }

    const userPosition: [number, number] | null = userLocation
        ? [userLocation.lat, userLocation.lng]
        : null

    return (
        <div
            className='relative mb-6 w-full overflow-hidden rounded-lg border border-gray-200 shadow-md'
            style={{ height: mapHeight }}
        >
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
                <ResizeTrigger height={mapHeight} />
                {userPosition && isMapReady && grayIcon && (
                    <UserLocationMarker position={userPosition} icon={grayIcon} />
                )}
                {items.map((item) => (
                    <Marker key={item.id} position={item.position}>
                        <Tooltip permanent={false}>
                            {item.title}
                        </Tooltip>
                        {item.popupContent && (
                            <Popup>
                                {item.popupContent}
                            </Popup>
                        )}
                    </Marker>
                ))}
            </MapContainer>

            {/* Resize Handle */}
            <div
                onMouseDown={startResizing}
                className='absolute bottom-0 right-0 z-[1001] flex h-6 w-6 cursor-ns-resize items-center justify-center rounded-tl bg-white/80 shadow-sm transition-colors hover:bg-yellow-400'
                title='Höhe ändern'
            >
                <OpenWithIcon sx={{ fontSize: 14, transform: 'rotate(45deg)', color: '#3d2817' }} />
            </div>
        </div>
    )
}

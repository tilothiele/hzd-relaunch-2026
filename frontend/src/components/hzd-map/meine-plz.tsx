'use client'

import { useCallback, useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import { useGeolocation } from '@/hooks/use-geolocation'

interface MeinePlzProps {
    onLocationChange: (location: { lat: number; lng: number } | null) => void
    onZipChange?: (zip: string) => void
    initialZip?: string
    fullWidth?: boolean
    size?: 'small' | 'medium'
}

export function MeinePlz({
    onLocationChange,
    onZipChange,
    initialZip = '',
    fullWidth = true,
    size = 'small'
}: MeinePlzProps) {
    const [zipCode, setZipCode] = useState(initialZip)
    const [zipLocation, setZipLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [isGeocodingZip, setIsGeocodingZip] = useState(false)

    const { zip: ipZip, location: ipLocation, isLoading: isGeoLoading } = useGeolocation()

    // Fülle PLZ automatisch aus IP, wenn verfügbar und Feld leer ist
    useEffect(() => {
        if (ipZip && !zipCode && !initialZip) {
            setZipCode(ipZip)
            if (onZipChange) onZipChange(ipZip)
        }
    }, [ipZip, initialZip, onZipChange]) // zipCode intentionally omitted to only trigger once when ipZip arrives

    // Geocode PLZ zu Koordinaten
    const geocodeZip = useCallback(async (zip: string) => {
        if (!zip || zip.trim().length === 0) {
            setZipLocation(null)
            onLocationChange(null)
            return
        }

        // Validiere PLZ (5-stellige deutsche PLZ)
        const zipPattern = /^\d{5}$/
        if (!zipPattern.test(zip.trim())) {
            setZipLocation(null)
            onLocationChange(null)
            return
        }

        setIsGeocodingZip(true)
        try {
            const response = await fetch(`/api/geocode?zip=${encodeURIComponent(zip.trim())}`)
            const data = await response.json()

            if (data.success && data.lat && data.lng) {
                const loc = {
                    lat: data.lat,
                    lng: data.lng,
                }
                setZipLocation(loc)
                onLocationChange(loc)
            } else {
                setZipLocation(null)
                onLocationChange(null)
            }
        } catch (error) {
            console.error('Geocoding fehlgeschlagen:', error)
            setZipLocation(null)
            onLocationChange(null)
        } finally {
            setIsGeocodingZip(false)
        }
    }, [onLocationChange])

    // Geocode PLZ, wenn sie sich ändert (mit Debounce)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (zipCode.trim().length > 0) {
                void geocodeZip(zipCode)
            } else {
                setZipLocation(null)
                onLocationChange(null)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [zipCode, geocodeZip, onLocationChange])

    const getHelperText = () => {
        if (isGeocodingZip) return 'Suche Koordinaten...'
        if (zipLocation) return 'Koordinaten gefunden'

        if (isGeoLoading) return 'PLZ wird über IP-Adresse gesucht...'
        if (ipZip && zipCode === ipZip) return 'PLZ über IP-Adresse gefunden'
        if (!isGeoLoading && !ipZip && !zipCode) return 'PLZ konnte nicht aus IP ermittelt werden'

        if (zipCode && zipCode.length === 5) return 'Koordinaten werden gesucht...'
        return ''
    }

    return (
        <TextField
            label='MeinePLZ'
            value={zipCode}
            onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                setZipCode(value)
                if (onZipChange) onZipChange(value)
            }}
            placeholder='Postleitzahl'
            fullWidth={fullWidth}
            size={size}
            helperText={getHelperText()}
        />
    )
}

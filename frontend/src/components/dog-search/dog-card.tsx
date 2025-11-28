'use client'

import Image from 'next/image'
import { Card, CardMedia, CardContent, Table, TableBody, TableRow, TableCell, Box } from '@mui/material'
import type { Dog } from '@/types'
import type { DistanceFilter } from '@/hooks/use-dogs'

interface DogCardProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
	onImageClick?: () => void
	userLocation?: { lat: number; lng: number } | null
	maxDistance?: DistanceFilter
}

/**
 * Berechnet die Entfernung zwischen zwei Koordinaten in Kilometern (Haversine-Formel)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371 // Erdradius in Kilometern
	const dLat = (lat2 - lat1) * Math.PI / 180
	const dLng = (lng2 - lng1) * Math.PI / 180
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLng / 2) * Math.sin(dLng / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

function getColorLabel(color: string | null | undefined): string {
	switch (color) {
	case 'S':
		return 'Schwarz'
	case 'SM':
		return 'Schwarz-Marken'
	case 'B':
		return 'Blond'
	default:
		return '-'
	}
}

function getSexLabel(sex: string | null | undefined): string {
	switch (sex) {
	case 'M':
		return 'Rüde'
	case 'F':
		return 'Hündin'
	default:
		return '-'
	}
}

function formatDate(dateString: string | null | undefined): string {
	if (!dateString) {
		return '-'
	}

	try {
		const date = new Date(dateString)
		return date.toLocaleDateString('de-DE', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		})
	} catch {
		return dateString
	}
}

function getGivenNameIcon(sex: string | null | undefined): string {
	switch (sex) {
	case 'M':
		return '/icons/zucht-icon-vater-hzd-hovawart-zuchtgemeinschaft.png'
	case 'F':
		return '/icons/zucht-icon-mutter-hzd-hovawart-zuchtgemeinschaft.png'
	default:
		return '/icons/zucht-icon-zwinger-hzd-hovawart-zuchtgemeinschaft.png'
	}
}

export function DogCard({ dog, strapiBaseUrl, onImageClick, userLocation, maxDistance }: DogCardProps) {
	const avatarUrl = dog.avatar?.url
	const avatarAlt = dog.avatar?.alternativeText ?? 'Hund'
	const fullName = dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'
	const baseUrl = strapiBaseUrl ?? ''

	// Berechne Entfernung, falls userLocation und dog.Location verfügbar sind
	let distance: number | null = null
	let isDistanceExceeded = false

	if (userLocation && dog.Location && typeof dog.Location.lat === 'number' && typeof dog.Location.lng === 'number') {
		distance = calculateDistance(
			userLocation.lat,
			userLocation.lng,
			dog.Location.lat,
			dog.Location.lng,
		)

		// Prüfe, ob die Entfernung größer als das eingestellte Kriterium ist
		if (maxDistance !== '' && maxDistance !== null && maxDistance !== undefined && distance > maxDistance) {
			isDistanceExceeded = true
		}
	}

	return (
		<Card
			sx={{
				'&:hover': {
					boxShadow: 3,
				},
			}}
		>
			{avatarUrl ? (
				<CardMedia
					component='div'
					sx={{
						position: 'relative',
						height: 192,
						cursor: 'pointer',
						'&:hover': {
							opacity: 0.9,
						},
					}}
					onClick={onImageClick}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							onImageClick?.()
						}
					}}
					tabIndex={0}
					role='button'
					aria-label='Hundedetails anzeigen'
				>
					<Image
						src={`${baseUrl}${avatarUrl}`}
						alt={avatarAlt}
						fill
						style={{ objectFit: 'cover' }}
						unoptimized
					/>
				</CardMedia>
			) : (
				<Box
					sx={{
						height: 192,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						bgcolor: 'grey.100',
						color: 'grey.400',
						cursor: 'pointer',
						'&:hover': {
							opacity: 0.9,
						},
					}}
					onClick={onImageClick}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							onImageClick?.()
						}
					}}
					tabIndex={0}
					role='button'
					aria-label='Hundedetails anzeigen'
				>
					Kein Bild
				</Box>
			)}

			<CardContent>
				<Table size='small'>
					<TableBody>
						<TableRow>
							<TableCell
								sx={{
									width: 48,
									paddingLeft: '1em',
									paddingRight: '1em',
									verticalAlign: 'middle',
								}}
							>
								<Box sx={{ width: 20, height: 20, position: 'relative' }}>
									<Image
										src='/icons/zucht-icon-zwinger-hzd-hovawart-zuchtgemeinschaft.png'
										alt='Zwingername'
										fill
										className='object-contain'
										unoptimized
									/>
								</Box>
							</TableCell>
							<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
								{fullName}
							</TableCell>
						</TableRow>
						{dog.givenName && dog.fullKennelName ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Box sx={{ width: 20, height: 20, position: 'relative' }}>
										<Image
											src={getGivenNameIcon(dog.sex)}
											alt='Rufname'
											fill
											className='object-contain'
											unoptimized
										/>
									</Box>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									{dog.givenName}
								</TableCell>
							</TableRow>
						) : null}
						<TableRow>
							<TableCell
								sx={{
									width: 48,
									paddingLeft: '1em',
									paddingRight: '1em',
									verticalAlign: 'middle',
								}}
							>
								<Box sx={{ width: 20, height: 20, position: 'relative' }}>
									<Image
										src='/icons/zucht-icon-farbe-hzd-hovawart-zuchtgemeinschaft.png'
										alt='Farbe'
										fill
										className='object-contain'
										unoptimized
									/>
								</Box>
							</TableCell>
							<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
								{getColorLabel(dog.color)}
							</TableCell>
						</TableRow>
						{dog.dateOfBirth ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Box sx={{ width: 20, height: 20, position: 'relative' }}>
										<Image
											src='/icons/zucht-icon-geburt-hzd-hovawart-zuchtgemeinschaft.png'
											alt='Geburtsdatum'
											fill
											className='object-contain'
											unoptimized
										/>
									</Box>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									{formatDate(dog.dateOfBirth)}
								</TableCell>
							</TableRow>
						) : null}
						{dog.microchipNo ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Box sx={{ width: 20, height: 20, position: 'relative' }}>
										<Image
											src='/icons/zucht-icon-microchip-hzd-hovawart-zuchtgemeinschaft.png'
											alt='Microchipnummer'
											fill
											className='object-contain'
											unoptimized
										/>
									</Box>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									{dog.microchipNo}
								</TableCell>
							</TableRow>
						) : null}
						{dog.SOD1 ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Box sx={{ width: 20, height: 20, position: 'relative' }}>
										<Image
											src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
											alt='SOD1'
											fill
											className='object-contain'
											unoptimized
										/>
									</Box>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									SOD1: {dog.SOD1}
								</TableCell>
							</TableRow>
						) : null}
						{dog.HD ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Box sx={{ width: 20, height: 20, position: 'relative' }}>
										<Image
											src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
											alt='HD'
											fill
											className='object-contain'
											unoptimized
										/>
									</Box>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									HD: {dog.HD}
								</TableCell>
							</TableRow>
						) : null}
						{distance !== null ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Box sx={{ width: 20, height: 20, position: 'relative' }}>
										<Image
											src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
											alt='Entfernung'
											fill
											className='object-contain'
											unoptimized
										/>
									</Box>
								</TableCell>
								<TableCell
									sx={{
										fontSize: '0.875rem',
										color: isDistanceExceeded ? 'error.main' : 'text.secondary',
										fontWeight: isDistanceExceeded ? 'bold' : 'normal',
									}}
								>
									{Math.round(distance)} km
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}


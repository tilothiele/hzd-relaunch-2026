'use client'

import { useId } from 'react'
import Image from 'next/image'
import { Card, CardMedia, CardContent, Table, TableBody, TableRow, TableCell, Box, Tooltip } from '@mui/material'
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
		return 'Schwarzmarken'
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

/**
 * Konvertiert SOD1-Wert von Schema-Format (N_N) zu Anzeige-Format (N/N)
 */
function formatSod1ForDisplay(sod1: string | null | undefined): string {
	if (!sod1) {
		return ''
	}
	return sod1.replace(/_/g, '/')
}

/**
 * Gibt das passende Standardbild basierend auf der Farbe zurück
 */
function getDefaultImageForColor(color: string | null | undefined): string {
	switch (color) {
	case 'S':
		return '/static-images/hovis/hovi-schwarz.png'
	case 'SM':
		return '/static-images/hovis/hovi-schwarzmarken.png'
	case 'B':
		return '/static-images/hovis/hovi-blond.png'
	default:
		return '/static-images/hovis/hovi-schwarz.png'
	}
}

/**
 * Berechnet das Alter basierend auf dem Geburtsdatum und gibt es als "Jahre Monate" zurück
 */
function calculateAge(dateOfBirth: string | null | undefined): string | null {
	if (!dateOfBirth) {
		return null
	}

	try {
		const birthDate = new Date(dateOfBirth)
		const today = new Date()

		// Prüfe, ob das Datum gültig ist
		if (isNaN(birthDate.getTime())) {
			return null
		}

		// Berechne die Differenz
		let years = today.getFullYear() - birthDate.getFullYear()
		let months = today.getMonth() - birthDate.getMonth()

		// Korrigiere, falls der Geburtstag noch nicht in diesem Monat war
		if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
			years--
			months += 12
		}

		// Formatiere das Ergebnis
		if (years === 0 && months === 0) {
			return '(0 Jahre 0 Monate)'
		}

		const yearsText = years === 1 ? 'Jahr' : 'Jahre'
		const monthsText = months === 1 ? 'Monat' : 'Monate'

		if (years === 0) {
			return `(${months} ${monthsText} alt)`
		}

		if (months === 0) {
			return `(${years} ${yearsText})`
		}

		return `(${years} ${yearsText} ${months} ${monthsText} alt)`
	} catch {
		return null
	}
}

/**
 * Männliches Geschlechtssymbol (Mars-Symbol)
 */
function MaleSexSymbol() {
	return (
		<Box
			sx={{
				position: 'absolute',
				top: 8,
				right: 8,
				width: 32,
				height: 32,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1,
			}}
		>
			<svg
				width='32'
				height='32'
				viewBox='0 0 100 100'
				xmlns='http://www.w3.org/2000/svg'
			>
				<circle
					cx='50'
					cy='50'
					r='30'
					fill='none'
					stroke='#4E6AAA'
					strokeWidth='20'
					strokeLinecap='round'
				/>
				<path
					d='M 75 25 L 90 10'
					stroke='#4E6AAA'
					strokeWidth='24'
					strokeLinecap='round'
				/>
				<polygon
					points='90,10 104,10 97,22'
					fill='#4E6AAA'
				/>
			</svg>
		</Box>
	)
}

/**
 * Weibliches Geschlechtssymbol (Venus-Symbol)
 */
function FemaleSexSymbol() {
	const maskId = useId()

	return (
		<Box
			sx={{
				position: 'absolute',
				top: 8,
				left: 8,
				width: 32,
				height: 32,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1,
			}}
		>
			<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450' width='300' height='450'>
				<defs>
					<mask id={maskId}>
						<rect width='100%' height='100%' fill='white' />
						<circle cx='150' cy='120' r='60' fill='black' />
					</mask>
				</defs>
				<g fill='#E7286B' mask={`url(#${maskId})`}>
					<circle cx='150' cy='120' r='100' />
					<rect x='138' y='220' width='24' height='100' />
					<rect x='100' y='280' width='100' height='24' />
				</g>
			</svg>
		</Box>
	)
}


export function DogCard({ dog, strapiBaseUrl, onImageClick, userLocation, maxDistance }: DogCardProps) {
	const avatarUrl = dog.avatar?.url
	const avatarAlt = dog.avatar?.alternativeText ?? 'Hund'
	const fullName = dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'
	const baseUrl = strapiBaseUrl ?? ''
	const age = calculateAge(dog.dateOfBirth)

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
						width: '100%',
						aspectRatio: '4 / 3',
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
					{dog.sex === 'M' && <MaleSexSymbol />}
					{dog.sex === 'F' && <FemaleSexSymbol />}
				</CardMedia>
			) : (
				<CardMedia
					component='div'
					sx={{
						position: 'relative',
						width: '100%',
						aspectRatio: '4 / 3',
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
						src={getDefaultImageForColor(dog.color)}
						alt={avatarAlt}
						fill
						style={{ objectFit: 'cover' }}
						unoptimized
					/>
					{dog.sex === 'M' && <MaleSexSymbol />}
					{dog.sex === 'F' && <FemaleSexSymbol />}
				</CardMedia>
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
								<Tooltip title='Zwingername' arrow>
									<Box sx={{ width: 20, height: 20, position: 'relative', cursor: 'help' }}>
										<Image
											src='/icons/zucht-icon-zwinger-hzd-hovawart-zuchtgemeinschaft.png'
											alt='Zwingername'
											fill
											className='object-contain'
											unoptimized
										/>
									</Box>
								</Tooltip>
							</TableCell>
							<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
								{fullName}
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell
								sx={{
									width: 48,
									paddingLeft: '1em',
									paddingRight: '1em',
									verticalAlign: 'middle',
								}}
							>
								<Tooltip title='Farbe' arrow>
									<Box sx={{ width: 20, height: 20, position: 'relative', cursor: 'help' }}>
										<Image
											src='/icons/zucht-icon-farbe-hzd-hovawart-zuchtgemeinschaft.png'
											alt='Farbe'
											fill
											className='object-contain'
											unoptimized
										/>
									</Box>
								</Tooltip>
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
									<Tooltip title='Geburtsdatum' arrow>
										<Box sx={{ width: 20, height: 20, position: 'relative', cursor: 'help' }}>
											<Image
												src='/icons/zucht-icon-geburt-hzd-hovawart-zuchtgemeinschaft.png'
												alt='Geburtsdatum'
												fill
												className='object-contain'
												unoptimized
											/>
										</Box>
									</Tooltip>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									{formatDate(dog.dateOfBirth)}
									{age ? ` ${age}` : ''}
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
									<Tooltip title='SOD1' arrow>
										<Box sx={{ width: 20, height: 20, position: 'relative', cursor: 'help' }}>
											<Image
												src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
												alt='SOD1'
												fill
												className='object-contain'
												unoptimized
											/>
										</Box>
									</Tooltip>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									SOD1: {formatSod1ForDisplay(dog.SOD1)}
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
									<Tooltip title='HD' arrow>
										<Box sx={{ width: 20, height: 20, position: 'relative', cursor: 'help' }}>
											<Image
												src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
												alt='HD'
												fill
												className='object-contain'
												unoptimized
											/>
										</Box>
									</Tooltip>
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
									<Tooltip title='Entfernung' arrow>
										<Box sx={{ width: 20, height: 20, position: 'relative', cursor: 'help' }}>
											<Image
												src='/icons/zucht-icon-position-hzd-hovawart-zuchtgemeinschaft.png'
												alt='Entfernung'
												fill
												className='object-contain'
												unoptimized
											/>
										</Box>
									</Tooltip>
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


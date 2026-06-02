'use client'

import Image from 'next/image'
import { Card, CardContent, CardMedia, Table, TableBody, TableCell, TableRow, Box, Tooltip } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import type { Breeder, HzdSetting } from '@/types'
import { resolveBreederContact, formatBreederLocation } from '@/lib/breeder-display-utils'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { calculateDistance } from '@/lib/geo-utils'

interface StudDogCardProps {
	breeder: Breeder
	strapiBaseUrl?: string | null
	onClick?: () => void
	userLocation?: { lat: number; lng: number } | null
	hzdSetting?: HzdSetting | null
}

export function StudDogCard({
	breeder,
	strapiBaseUrl,
	onClick,
	userLocation,
	hzdSetting,
}: StudDogCardProps) {
	const contact = resolveBreederContact(breeder)
	const locationLabel = formatBreederLocation(contact)
	const displayName = contact.ownerDisplayName
	let distance: number | null = null

	if (
		userLocation &&
		typeof contact.locationLat === 'number' &&
		typeof contact.locationLng === 'number'
	) {
		distance = calculateDistance(
			userLocation.lat,
			userLocation.lng,
			contact.locationLat,
			contact.locationLng,
		)
	}

	return (
		<Card
			sx={{
				'&:hover': {
					boxShadow: 3,
				},
				cursor: onClick ? 'pointer' : 'default',
			}}
			onClick={onClick}
		>
			<CardMedia
				component='div'
				sx={{
					position: 'relative',
					width: '100%',
					aspectRatio: '4 / 3',
					cursor: onClick ? 'pointer' : 'default',
					'&:hover': {
						opacity: onClick ? 0.9 : 1,
					},
				}}
			>
				<Image
					src={resolveMediaUrl(
						breeder.avatar || hzdSetting?.DefaultBreederAvatar,
						strapiBaseUrl,
					) || '/static-images/placeholder/user-avatar.png'}
					alt={displayName || 'Deckrüdenbesitzer'}
					fill
					style={{ objectFit: 'cover' }}
					unoptimized
					sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
				/>
			</CardMedia>

			<CardContent>
				<Table size='small'>
					<TableBody>
						{displayName ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Tooltip title='Deckrüdenbesitzer' arrow>
										<PersonIcon sx={{ fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
									</Tooltip>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary', fontWeight: 'bold' }}>
									{displayName}
								</TableCell>
							</TableRow>
						) : null}

						{locationLabel ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Tooltip title='Ort' arrow>
										<Box sx={{ width: 20, height: 20, position: 'relative', cursor: 'help' }}>
											<Image
												src='/icons/zucht-icon-position-hzd-hovawart-zuchtgemeinschaft.png'
												alt='Ort'
												fill
												className='object-contain'
												unoptimized
											/>
										</Box>
									</Tooltip>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									{locationLabel}
								</TableCell>
							</TableRow>
						) : null}

						{contact.phone ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Tooltip title='Telefon' arrow>
										<PhoneIcon sx={{ fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
									</Tooltip>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									{contact.phone}
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
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
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

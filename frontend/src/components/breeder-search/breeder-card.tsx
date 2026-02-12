'use client'

import Image from 'next/image'
import Link from 'next/link'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Card, CardMedia, CardContent, Table, TableBody, TableRow, TableCell, Box, Tooltip } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import type { Breeder, HzdSetting } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'

import { calculateDistance } from '@/lib/geo-utils'

interface BreederCardProps {
	breeder: Breeder
	strapiBaseUrl?: string | null
	onClick?: () => void
	userLocation?: { lat: number; lng: number } | null
	maxDistance?: number | string
	hzdSetting?: HzdSetting | null
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

export function BreederCard({ breeder, strapiBaseUrl, onClick, userLocation, maxDistance, hzdSetting }: BreederCardProps) {
	const kennelName = breeder.kennelName ?? 'Kein Zwingername bekannt'
	const member = breeder.member

	let distance: number | null = null
	let isDistanceExceeded = false

	if (userLocation && typeof member?.locationLat === 'number' && typeof member?.locationLng === 'number') {
		distance = calculateDistance(
			userLocation.lat,
			userLocation.lng,
			member.locationLat,
			member.locationLng
		)

		if (maxDistance && maxDistance !== '' && typeof maxDistance === 'number' && distance > maxDistance) {
			isDistanceExceeded = true
		} else if (maxDistance && maxDistance !== '' && typeof maxDistance === 'string' && distance > parseInt(maxDistance)) {
			isDistanceExceeded = true
		}
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
						strapiBaseUrl
					) || '/static-images/placeholder/user-avatar.png'}
					alt={kennelName}
					fill
					style={{ objectFit: 'cover' }}
					unoptimized
					sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
				/>
			</CardMedia>

			<CardContent>
				<Table size='small'>
					<TableBody>
						{/* Zwingername */}
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
							<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary', fontWeight: 'bold' }}>
								{breeder.WebsiteUrl ? (
									<Link
										href={breeder.WebsiteUrl}
										target='_blank'
										rel='noopener noreferrer'
										className='hover:underline inline-flex items-center gap-1 transition-colors'
										style={{ color: 'var(--color-submit-button)' }}
										onClick={(e) => e.stopPropagation()}
									>
										{kennelName}
										<OpenInNewIcon sx={{ fontSize: 14 }} />
									</Link>
								) : (
									kennelName
								)}
							</TableCell>
						</TableRow>

						{/* Zuchterlaubnis seit */}
						{breeder.breedingLicenseSince && (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Tooltip title='Zuchterlaubnis seit' arrow>
										<Box sx={{ width: 20, height: 20, position: 'relative', cursor: 'help' }}>
											<Image
												src='/icons/zucht-icon-zulassung-hzd-hovawart-zuchtgemeinschaft.png'
												alt='Zuchterlaubnis seit'
												fill
												className='object-contain'
												unoptimized
											/>
										</Box>
									</Tooltip>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									Seit {formatDate(breeder.breedingLicenseSince)}
								</TableCell>
							</TableRow>
						)}

						{/* Züchter Name */}
						{/* Züchter Name */}
						{(breeder.owner_member?.firstName && breeder.owner_member?.lastName) ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Tooltip title='Züchter' arrow>
										<PersonIcon sx={{ fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
									</Tooltip>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									{breeder.owner_member.firstName} {breeder.owner_member.lastName}
								</TableCell>
							</TableRow>
						) : (member?.firstName && member?.lastName ? (
							<TableRow>
								<TableCell
									sx={{
										width: 48,
										paddingLeft: '1em',
										paddingRight: '1em',
										verticalAlign: 'middle',
									}}
								>
									<Tooltip title='Züchter' arrow>
										<PersonIcon sx={{ fontSize: 20, color: 'text.secondary', cursor: 'help' }} />
									</Tooltip>
								</TableCell>
								<TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
									{member.firstName} {member.lastName}
								</TableCell>
							</TableRow>
						) : null)}

						{/* Ort / PLZ */}
						{(member?.zip || member?.city || member?.countryCode) && (
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
									{[member.zip, member.city].filter(Boolean).join(' ')}
									{member.countryCode && member.countryCode !== 'DE' && ` (${member.countryCode})`}
								</TableCell>
							</TableRow>
						)}

						{/* Telefon */}
						{member?.phone && (
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
									{member.phone}
								</TableCell>
							</TableRow>
						)}

						{/* Entfernung */}
						{distance !== null && (
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
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}

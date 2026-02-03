'use client'

import Image from 'next/image'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
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

function getRegionLabel(region: string | null | undefined): string {
	if (!region) {
		return '-'
	}

	return region
}

export function BreederCard({ breeder, strapiBaseUrl, onClick, userLocation, maxDistance, hzdSetting }: BreederCardProps) {
	const kennelName = breeder.kennelName ?? 'Kein Zwingername bekannt'
	const member = breeder.member

	let distance: number | null = null
	if (userLocation && member?.geoLocation && typeof member.geoLocation.lat === 'number' && typeof member.geoLocation.lng === 'number') {
		distance = calculateDistance(
			userLocation.lat,
			userLocation.lng,
			member.geoLocation.lat,
			member.geoLocation.lng
		)
	}

	return (
		<div
			className='flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md sm:flex-row cursor-pointer'
			style={{ minHeight: '120px' }}
			onClick={onClick}
		>
			<div className='relative h-48 w-full shrink-0 bg-gray-100 sm:h-auto sm:w-48'>
				<Image
					src={resolveMediaUrl(
						breeder.avatar || hzdSetting?.DefaultBreederAvatar,
						strapiBaseUrl
					) || '/static-images/placeholder/user-avatar.png'}
					alt={kennelName}
					fill
					className='object-cover'
					unoptimized
					sizes='(max-width: 640px) 100vw, 192px'
				/>
			</div>

			<div className='flex flex-1 flex-col p-4'>
				<div className='mb-3 flex justify-between items-start'>
					<h3 className='text-lg font-semibold text-gray-900'>
						{breeder.WebsiteUrl ? (
							<a
								href={breeder.WebsiteUrl}
								target='_blank'
								rel='noopener noreferrer'
								className='hover:underline inline-flex items-center gap-1 transition-colors'
								style={{ color: 'var(--color-submit-button)' }}
								onClick={(e) => e.stopPropagation()}
							>
								{kennelName}
								<OpenInNewIcon sx={{ fontSize: 16 }} />
							</a>
						) : (
							kennelName
						)}
					</h3>
					{distance !== null && (
						<span className='rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700'>
							~{Math.round(distance)} km
						</span>
					)}
				</div>
				<div className='space-y-2 text-sm text-gray-600'>
					{breeder.breedingLicenseSince ? (
						<p>
							<strong>Zuchterlaubnis seit:</strong> {formatDate(breeder.breedingLicenseSince)}
						</p>
					) : null}
					{member?.firstName && member?.lastName ? (
						<p>
							<strong>Züchter:</strong> {member.firstName} {member.lastName}
						</p>
					) : null}
					{member?.region ? (
						<p>
							<strong>Region:</strong> {getRegionLabel(member.region)}
						</p>
					) : null}
					{member?.phone ? (
						<p>
							<strong>Telefon:</strong> {member.phone}
						</p>
					) : null}
					{member?.address1 || member?.address2 ? (
						<p>
							<strong>Adresse:</strong>{' '}
							{[member.address1, member.address2].filter(Boolean).join(', ')}
						</p>
					) : null}
					{member?.zip || member?.countryCode ? (
						<p>
							<strong>PLZ / Land:</strong>{' '}
							{[member.zip, member.countryCode].filter(Boolean).join(' / ')}
						</p>
					) : null}

				</div>
			</div>
		</div>
	)
}






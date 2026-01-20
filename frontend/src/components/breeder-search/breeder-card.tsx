'use client'

import Image from 'next/image'
import type { Breeder } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'

interface BreederCardProps {
	breeder: Breeder
	strapiBaseUrl?: string | null
	onClick?: () => void
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

export function BreederCard({ breeder, strapiBaseUrl, onClick }: BreederCardProps) {
	const kennelName = breeder.kennelName ?? 'Kein Zwingername bekannt'
	const member = breeder.member

	return (
		<div
			className='flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md sm:flex-row cursor-pointer'
			style={{ minHeight: '120px' }}
			onClick={onClick}
		>
			<div className='relative h-48 w-full shrink-0 bg-gray-100 sm:h-auto sm:w-48'>
				<Image
					src={breeder.avatar ? resolveMediaUrl(breeder.avatar, strapiBaseUrl) || '/static-images/placeholder/user-avatar.png' : '/static-images/placeholder/user-avatar.png'}
					alt={kennelName}
					fill
					className='object-cover'
					unoptimized
					sizes='(max-width: 640px) 100vw, 192px'
				/>
			</div>

			<div className='flex flex-1 flex-col p-4'>
				<h3 className='mb-3 text-lg font-semibold text-gray-900'>
					{kennelName}
				</h3>
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
					{breeder.WebsiteUrl ? (
						<p className='mt-2 pt-2 border-t border-gray-100'>
							<a
								href={breeder.WebsiteUrl}
								target='_blank'
								rel='noopener noreferrer'
								className='text-submit-button hover:underline'
								style={{ color: 'var(--color-submit-button)' }}
							>
								{breeder.WebsiteUrl}
							</a>
						</p>
					) : null}
				</div>
			</div>
		</div>
	)
}






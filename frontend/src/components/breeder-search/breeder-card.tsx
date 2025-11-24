'use client'

import type { Breeder } from '@/types'

interface BreederCardProps {
	breeder: Breeder
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

export function BreederCard({ breeder }: BreederCardProps) {
	const kennelName = breeder.kennelName ?? 'Unbekannt'
	const member = breeder.member

	return (
		<div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md'>
			<h3 className='mb-3 text-lg font-semibold text-gray-900'>
				{kennelName}
			</h3>
			<div className='space-y-2 text-sm text-gray-600'>
				{breeder.breedingLicenseSince ? (
					<p>
						<strong>Zuchterlaubnis seit:</strong> {formatDate(breeder.breedingLicenseSince)}
					</p>
				) : null}
				{member?.fullName ? (
					<p>
						<strong>Züchter:</strong> {member.fullName}
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
				{member?.adress1 || member?.adress2 ? (
					<p>
						<strong>Adresse:</strong>{' '}
						{[member.adress1, member.adress2].filter(Boolean).join(', ')}
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
	)
}






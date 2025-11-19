'use client'

import Image from 'next/image'
import type { Dog } from '@/types'

interface DogCardProps {
	dog: Dog
	strapiBaseUrl: string | null | undefined
}

function getColorLabel(color: string | null | undefined): string {
	switch (color) {
	case 'S':
		return 'Schwarz'
	case 'SM':
		return 'Schwarz-Marken'
	case 'B':
		return 'Braun'
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

export function DogCard({ dog, strapiBaseUrl }: DogCardProps) {
	const avatarUrl = dog.avatar?.url
	const avatarAlt = dog.avatar?.alternativeText ?? 'Hund'
	const fullName = dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'
	const baseUrl = strapiBaseUrl ?? ''

	return (
		<div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md'>
			{avatarUrl ? (
				<div className='mb-3 h-48 w-full overflow-hidden rounded'>
					<Image
						src={`${baseUrl}${avatarUrl}`}
						alt={avatarAlt}
						width={400}
						height={192}
						className='h-full w-full object-cover object-center'
						unoptimized
					/>
				</div>
			) : (
				<div className='mb-3 flex h-48 w-full items-center justify-center rounded bg-gray-100 text-gray-400'>
					Kein Bild
				</div>
			)}

			<table className='w-full text-sm text-gray-600'>
				<tbody>
                    <tr>
						<td className='w-8 py-2' style={{ paddingLeft: '1em', paddingRight: '1em', verticalAlign: 'middle' }}>
							<div style={{ width: '20px', height: '20px', position: 'relative' }}>
								<Image
									src='/icons/zucht-icon-zwinger-hzd-hovawart-zuchtgemeinschaft.png'
									alt='Zwingername'
									width={20}
									height={20}
									className='object-contain'
									unoptimized
									style={{ width: '100%', height: '100%' }}
								/>
							</div>
						</td>
						<td className='py-2'>{fullName}</td>
					</tr>
					{dog.givenName && dog.fullKennelName ? (
						<tr>
							<td className='w-8 py-2' style={{ paddingLeft: '1em', paddingRight: '1em', verticalAlign: 'middle' }}>
								<div style={{ width: '20px', height: '20px', position: 'relative' }}>
									<Image
										src={getGivenNameIcon(dog.sex)}
										alt='Rufname'
										width={20}
										height={20}
										className='object-contain'
										unoptimized
										style={{ width: '100%', height: '100%' }}
									/>
								</div>
							</td>
							<td className='py-2'>{dog.givenName}</td>
						</tr>
					) : null}
					<tr>
						<td className='w-8 py-2' style={{ paddingLeft: '1em', paddingRight: '1em', verticalAlign: 'middle' }}>
							<div style={{ width: '20px', height: '20px', position: 'relative' }}>
								<Image
									src='/icons/zucht-icon-farbe-hzd-hovawart-zuchtgemeinschaft.png'
									alt='Farbe'
									width={20}
									height={20}
									className='object-contain'
									unoptimized
									style={{ width: '100%', height: '100%' }}
								/>
							</div>
						</td>
						<td className='py-2'>{getColorLabel(dog.color)}</td>
					</tr>
					{dog.dateOfBirth ? (
						<tr>
							<td className='w-8 py-2' style={{ paddingLeft: '1em', paddingRight: '1em', verticalAlign: 'middle' }}>
								<div style={{ width: '20px', height: '20px', position: 'relative' }}>
									<Image
										src='/icons/zucht-icon-geburt-hzd-hovawart-zuchtgemeinschaft.png'
										alt='Geburtsdatum'
										width={20}
										height={20}
										className='object-contain'
										unoptimized
										style={{ width: '100%', height: '100%' }}
									/>
								</div>
							</td>
							<td className='py-2'>{formatDate(dog.dateOfBirth)}</td>
						</tr>
					) : null}
					{dog.microchipNo ? (
						<tr>
							<td className='w-8 py-2' style={{ paddingLeft: '1em', paddingRight: '1em', verticalAlign: 'middle' }}>
								<div style={{ width: '20px', height: '20px', position: 'relative' }}>
									<Image
										src='/icons/zucht-icon-microchip-hzd-hovawart-zuchtgemeinschaft.png'
										alt='Microchipnummer'
										width={20}
										height={20}
										className='object-contain'
										unoptimized
										style={{ width: '100%', height: '100%' }}
									/>
								</div>
							</td>
							<td className='py-2'>{dog.microchipNo}</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	)
}


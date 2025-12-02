'use client'

import Image from 'next/image'
import { Checkbox, Tooltip } from '@mui/material'
import type { Dog } from '@/types'

interface DogDataTabProps {
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
			return `(${months} ${monthsText})`
		}

		if (months === 0) {
			return `(${years} ${yearsText})`
		}

		return `(${years} ${yearsText} ${months} ${monthsText})`
	} catch {
		return null
	}
}

export function DogDataTab({ dog, strapiBaseUrl }: DogDataTabProps) {
	const avatarUrl = dog.avatar?.url
	const avatarAlt = dog.avatar?.alternativeText ?? 'Hund'
	const baseUrl = strapiBaseUrl ?? ''
	const age = calculateAge(dog.dateOfBirth)

	return (
		<div>
			{/* Image */}
			{avatarUrl ? (
				<div className='mb-6 h-96 w-full overflow-hidden rounded-lg'>
					<Image
						src={`${baseUrl}${avatarUrl}`}
						alt={avatarAlt}
						width={800}
						height={384}
						className='h-full w-full object-cover object-center'
						unoptimized
					/>
				</div>
			) : (
				<div className='mb-6 flex h-96 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-400'>
					Kein Bild verfügbar
				</div>
			)}

			{/* Details Grid */}
			<div className='grid gap-6 md:grid-cols-2'>
				<div className='space-y-4'>
					<div className='flex items-center gap-4'>
						<Tooltip title='Zwingername' arrow>
							<div className='flex h-10 w-10 cursor-help items-center justify-center'>
								<Image
									src='/icons/zucht-icon-zwinger-hzd-hovawart-zuchtgemeinschaft.png'
									alt='Zwingername'
									width={24}
									height={24}
									className='object-contain'
									unoptimized
								/>
							</div>
						</Tooltip>
						<div>
							<p className='text-base text-gray-900'>
								{dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'}
							</p>
						</div>
					</div>

					{dog.givenName && dog.fullKennelName ? (
						<div className='flex items-center gap-4'>
							<Tooltip title='Rufname' arrow>
								<div className='flex h-10 w-10 cursor-help items-center justify-center'>
									<Image
										src={getGivenNameIcon(dog.sex)}
										alt='Rufname'
										width={24}
										height={24}
										className='object-contain'
										unoptimized
									/>
								</div>
							</Tooltip>
							<div>
								<p className='text-base text-gray-900'>{dog.givenName}</p>
							</div>
						</div>
					) : null}

					<div className='flex items-center gap-4'>
						<Tooltip title='Geschlecht' arrow>
							<div className='flex h-10 w-10 cursor-help items-center justify-center'>
								<Image
									src={getGivenNameIcon(dog.sex)}
									alt='Geschlecht'
									width={24}
									height={24}
									className='object-contain'
									unoptimized
								/>
							</div>
						</Tooltip>
						<div>
							<p className='text-base text-gray-900'>{getSexLabel(dog.sex)}</p>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<Tooltip title='Farbe' arrow>
							<div className='flex h-10 w-10 cursor-help items-center justify-center'>
								<Image
									src='/icons/zucht-icon-farbe-hzd-hovawart-zuchtgemeinschaft.png'
									alt='Farbe'
									width={24}
									height={24}
									className='object-contain'
									unoptimized
								/>
							</div>
						</Tooltip>
						<div>
							<p className='text-base text-gray-900'>{getColorLabel(dog.color)}</p>
						</div>
					</div>
				</div>

				<div className='space-y-4'>
					{dog.dateOfBirth ? (
						<div className='flex items-center gap-4'>
							<Tooltip title='Geburtsdatum' arrow>
								<div className='flex h-10 w-10 cursor-help items-center justify-center'>
									<Image
										src='/icons/zucht-icon-geburt-hzd-hovawart-zuchtgemeinschaft.png'
										alt='Geburtsdatum'
										width={24}
										height={24}
										className='object-contain'
										unoptimized
									/>
								</div>
							</Tooltip>
							<div>
								<p className='text-base text-gray-900'>
									{formatDate(dog.dateOfBirth)}
									{age ? ` - ${age}` : ''}
								</p>
							</div>
						</div>
					) : null}

					{dog.dateOfDeath ? (
						<div className='flex items-center gap-4'>
							<Tooltip title='Todesdatum' arrow>
								<div className='flex h-10 w-10 cursor-help items-center justify-center'>
									<svg
										className='h-6 w-6 text-gray-400'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
										/>
									</svg>
								</div>
							</Tooltip>
							<div>
								<p className='text-base text-gray-900'>{formatDate(dog.dateOfDeath)}</p>
							</div>
						</div>
					) : null}

					{dog.microchipNo ? (
						<div className='flex items-center gap-4'>
							<Tooltip title='Chipnummer' arrow>
								<div className='flex h-10 w-10 cursor-help items-center justify-center'>
									<Image
										src='/icons/zucht-icon-microchip-hzd-hovawart-zuchtgemeinschaft.png'
										alt='Microchipnummer'
										width={24}
										height={24}
										className='object-contain'
										unoptimized
									/>
								</div>
							</Tooltip>
							<div>
								<p className='text-base text-gray-900'>{dog.microchipNo}</p>
							</div>
						</div>
					) : null}

					<div className='flex items-center gap-4'>
						<Tooltip title='SOD1' arrow>
							<div className='flex h-10 w-10 cursor-help items-center justify-center'>
								<Image
									src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
									alt='SOD1'
									width={24}
									height={24}
									className='object-contain'
									unoptimized
								/>
							</div>
						</Tooltip>
						<div>
							<p className='text-base text-gray-900'>{dog.SOD1 ? formatSod1ForDisplay(dog.SOD1) : 'Nicht verfügbar'}</p>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<Tooltip title='HD' arrow>
							<div className='flex h-10 w-10 cursor-help items-center justify-center'>
								<Image
									src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
									alt='HD'
									width={24}
									height={24}
									className='object-contain'
									unoptimized
								/>
							</div>
						</Tooltip>
						<div>
							<p className='text-base text-gray-900'>{dog.HD ?? 'Nicht verfügbar'}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Untersuchungen */}
			<div className='mt-8 border-t border-gray-200 pt-8 pb-8'>
				<div className='grid gap-6 md:grid-cols-2'>
					<div className='space-y-4'>
						<div className='flex items-center gap-4'>
							<div className='flex h-10 w-10 items-center justify-center'>
								<Checkbox
									checked={dog.Genprofil === true}
									disabled
									sx={{
										color: dog.Genprofil === true ? '#10b981' : '#d1d5db',
										'&.Mui-checked': {
											color: '#10b981',
										},
										'&.Mui-disabled': {
											color: dog.Genprofil === true ? '#10b981' : '#d1d5db',
										},
									}}
								/>
							</div>
							<div>
								<p className={`text-base text-gray-900 ${dog.Genprofil !== true ? 'line-through' : ''}`}>
									Genprofil
								</p>
							</div>
						</div>
						<div className='flex items-center gap-4'>
							<div className='flex h-10 w-10 items-center justify-center'>
								<Checkbox
									checked={dog.HeartCheck === true}
									disabled
									sx={{
										color: dog.HeartCheck === true ? '#10b981' : '#d1d5db',
										'&.Mui-checked': {
											color: '#10b981',
										},
										'&.Mui-disabled': {
											color: dog.HeartCheck === true ? '#10b981' : '#d1d5db',
										},
									}}
								/>
							</div>
							<div>
								<p className={`text-base text-gray-900 ${dog.HeartCheck !== true ? 'line-through' : ''}`}>
									Herzuntersuchung
								</p>
							</div>
						</div>
					</div>
					<div className='space-y-4'>
						<div className='flex items-center gap-4'>
							<div className='flex h-10 w-10 items-center justify-center'>
								<Checkbox
									checked={dog.EyesCheck === true}
									disabled
									sx={{
										color: dog.EyesCheck === true ? '#10b981' : '#d1d5db',
										'&.Mui-checked': {
											color: '#10b981',
										},
										'&.Mui-disabled': {
											color: dog.EyesCheck === true ? '#10b981' : '#d1d5db',
										},
									}}
								/>
							</div>
							<div>
								<p className={`text-base text-gray-900 ${dog.EyesCheck !== true ? 'line-through' : ''}`}>
									Augenuntersuchung
								</p>
							</div>
						</div>
						<div className='flex items-center gap-4'>
							<div className='flex h-10 w-10 items-center justify-center'>
								<Checkbox
									checked={dog.ColorCheck === true}
									disabled
									sx={{
										color: dog.ColorCheck === true ? '#10b981' : '#d1d5db',
										'&.Mui-checked': {
											color: '#10b981',
										},
										'&.Mui-disabled': {
											color: dog.ColorCheck === true ? '#10b981' : '#d1d5db',
										},
									}}
								/>
							</div>
							<div>
								<p
									className={`text-base text-gray-900 ${
										dog.ColorCheck !== true ? 'line-through' : ''
									}`}
								>
									Farbverdünnung
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}





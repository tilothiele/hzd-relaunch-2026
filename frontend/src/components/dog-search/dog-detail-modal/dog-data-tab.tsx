'use client'

import Image from 'next/image'
import { Checkbox, FormControlLabel } from '@mui/material'
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

export function DogDataTab({ dog, strapiBaseUrl }: DogDataTabProps) {
	const avatarUrl = dog.avatar?.url
	const avatarAlt = dog.avatar?.alternativeText ?? 'Hund'
	const baseUrl = strapiBaseUrl ?? ''

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
						<div className='flex h-10 w-10 items-center justify-center'>
							<Image
								src='/icons/zucht-icon-zwinger-hzd-hovawart-zuchtgemeinschaft.png'
								alt='Zwingername'
								width={24}
								height={24}
								className='object-contain'
								unoptimized
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-gray-500'>Zwingername</p>
							<p className='text-base text-gray-900'>
								{dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'}
							</p>
						</div>
					</div>

					{dog.givenName && dog.fullKennelName ? (
						<div className='flex items-center gap-4'>
							<div className='flex h-10 w-10 items-center justify-center'>
								<Image
									src={getGivenNameIcon(dog.sex)}
									alt='Rufname'
									width={24}
									height={24}
									className='object-contain'
									unoptimized
								/>
							</div>
							<div>
								<p className='text-sm font-medium text-gray-500'>Rufname</p>
								<p className='text-base text-gray-900'>{dog.givenName}</p>
							</div>
						</div>
					) : null}

					<div className='flex items-center gap-4'>
						<div className='flex h-10 w-10 items-center justify-center'>
							<Image
								src={getGivenNameIcon(dog.sex)}
								alt='Geschlecht'
								width={24}
								height={24}
								className='object-contain'
								unoptimized
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-gray-500'>Geschlecht</p>
							<p className='text-base text-gray-900'>{getSexLabel(dog.sex)}</p>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<div className='flex h-10 w-10 items-center justify-center'>
							<Image
								src='/icons/zucht-icon-farbe-hzd-hovawart-zuchtgemeinschaft.png'
								alt='Farbe'
								width={24}
								height={24}
								className='object-contain'
								unoptimized
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-gray-500'>Farbe</p>
							<p className='text-base text-gray-900'>{getColorLabel(dog.color)}</p>
						</div>
					</div>
				</div>

				<div className='space-y-4'>
					{dog.dateOfBirth ? (
						<div className='flex items-center gap-4'>
							<div className='flex h-10 w-10 items-center justify-center'>
								<Image
									src='/icons/zucht-icon-geburt-hzd-hovawart-zuchtgemeinschaft.png'
									alt='Geburtsdatum'
									width={24}
									height={24}
									className='object-contain'
									unoptimized
								/>
							</div>
							<div>
								<p className='text-sm font-medium text-gray-500'>Geburtsdatum</p>
								<p className='text-base text-gray-900'>{formatDate(dog.dateOfBirth)}</p>
							</div>
						</div>
					) : null}

					{dog.dateOfDeath ? (
						<div className='flex items-center gap-4'>
							<div className='flex h-10 w-10 items-center justify-center'>
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
							<div>
								<p className='text-sm font-medium text-gray-500'>Todesdatum</p>
								<p className='text-base text-gray-900'>{formatDate(dog.dateOfDeath)}</p>
							</div>
						</div>
					) : null}

					{dog.microchipNo ? (
						<div className='flex items-center gap-4'>
							<div className='flex h-10 w-10 items-center justify-center'>
								<Image
									src='/icons/zucht-icon-microchip-hzd-hovawart-zuchtgemeinschaft.png'
									alt='Microchipnummer'
									width={24}
									height={24}
									className='object-contain'
									unoptimized
								/>
							</div>
							<div>
								<p className='text-sm font-medium text-gray-500'>Chipnummer</p>
								<p className='text-base text-gray-900'>{dog.microchipNo}</p>
							</div>
						</div>
					) : null}

					<div className='flex items-center gap-4'>
						<div className='flex h-10 w-10 items-center justify-center'>
							<Image
								src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
								alt='SOD1'
								width={24}
								height={24}
								className='object-contain'
								unoptimized
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-gray-500'>SOD1</p>
							<p className='text-base text-gray-900'>{dog.SOD1 ?? 'Nicht verfügbar'}</p>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<div className='flex h-10 w-10 items-center justify-center'>
							<Image
								src='/icons/zucht-icon-pokal-hzd-hovawart-zuchtgemeinschaft.png'
								alt='HD'
								width={24}
								height={24}
								className='object-contain'
								unoptimized
							/>
						</div>
						<div>
							<p className='text-sm font-medium text-gray-500'>HD</p>
							<p className='text-base text-gray-900'>{dog.HD ?? 'Nicht verfügbar'}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Untersuchungen */}
			<div className='mt-6 border-t border-gray-200 pt-6'>
				<h3 className='mb-4 text-lg font-semibold text-gray-900'>Untersuchungen</h3>
				<div className='grid gap-4 md:grid-cols-2'>
					<FormControlLabel
						control={
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
						}
						label='Genprofil'
					/>
					<FormControlLabel
						control={
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
						}
						label='Augenuntersuchung'
					/>
					<FormControlLabel
						control={
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
						}
						label='Herzuntersuchung'
					/>
					<FormControlLabel
						control={
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
						}
						label='Farbverdünnung'
					/>
				</div>
			</div>
		</div>
	)
}





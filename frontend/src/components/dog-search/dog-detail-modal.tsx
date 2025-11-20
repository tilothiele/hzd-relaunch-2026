'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import type { Dog } from '@/types'

interface DogDetailModalProps {
	dog: Dog | null
	strapiBaseUrl: string | null | undefined
	isOpen: boolean
	onClose: () => void
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

export function DogDetailModal({
	dog,
	strapiBaseUrl,
	isOpen,
	onClose,
}: DogDetailModalProps) {
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			window.addEventListener('keydown', handleEscape)
		}

		return () => {
			window.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen, onClose])

	if (!isOpen || !dog) {
		return null
	}

	const avatarUrl = dog.avatar?.url
	const avatarAlt = dog.avatar?.alternativeText ?? 'Hund'
	const fullName = dog.fullKennelName ?? dog.givenName ?? 'Unbekannt'
	const baseUrl = strapiBaseUrl ?? ''

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
			onClick={onClose}
		>
			<div
				className='relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl'
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close Button */}
				<button
					type='button'
					onClick={onClose}
					className='absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-md transition-colors hover:bg-white'
					aria-label='Schließen'
				>
					<svg
						className='h-6 w-6 text-gray-600'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 18L18 6M6 6l12 12'
						/>
					</svg>
				</button>

				{/* Content */}
				<div className='p-8'>
					{/* Header */}
					<div className='mb-6'>
						<h2 className='text-3xl font-bold text-gray-900'>{fullName}</h2>
						{dog.givenName && dog.fullKennelName ? (
							<p className='mt-2 text-lg text-gray-600'>{dog.givenName}</p>
						) : null}
					</div>

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
									<p className='text-base text-gray-900'>{fullName}</p>
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
									{dog.Sod1Test === true ? (
										<div
											style={{
												width: '24px',
												height: '24px',
												borderRadius: '4px',
												backgroundColor: '#10b981',
												border: '2px solid #10b981',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<svg
												width='16'
												height='16'
												viewBox='0 0 14 14'
												fill='none'
												xmlns='http://www.w3.org/2000/svg'
											>
												<path
													d='M11.6667 3.5L5.25 9.91667L2.33334 7'
													stroke='white'
													strokeWidth='2'
													strokeLinecap='round'
													strokeLinejoin='round'
												/>
											</svg>
										</div>
									) : (
										<div
											style={{
												width: '24px',
												height: '24px',
												borderRadius: '4px',
												border: '2px solid #d1d5db',
												backgroundColor: 'transparent',
											}}
										/>
									)}
								</div>
								<div>
									<p className='text-sm font-medium text-gray-500'>SOD1-Test</p>
									<p className='text-base text-gray-900'>
										{dog.Sod1Test === true ? 'Ja' : dog.Sod1Test === false ? 'Nein' : 'Nicht verfügbar'}
									</p>
								</div>
							</div>

							<div className='flex items-center gap-4'>
								<div className='flex h-10 w-10 items-center justify-center'>
									{dog.HDTest === true ? (
										<div
											style={{
												width: '24px',
												height: '24px',
												borderRadius: '4px',
												backgroundColor: '#10b981',
												border: '2px solid #10b981',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											<svg
												width='16'
												height='16'
												viewBox='0 0 14 14'
												fill='none'
												xmlns='http://www.w3.org/2000/svg'
											>
												<path
													d='M11.6667 3.5L5.25 9.91667L2.33334 7'
													stroke='white'
													strokeWidth='2'
													strokeLinecap='round'
													strokeLinejoin='round'
												/>
											</svg>
										</div>
									) : (
										<div
											style={{
												width: '24px',
												height: '24px',
												borderRadius: '4px',
												border: '2px solid #d1d5db',
												backgroundColor: 'transparent',
											}}
										/>
									)}
								</div>
								<div>
									<p className='text-sm font-medium text-gray-500'>HD-Test</p>
									<p className='text-base text-gray-900'>
										{dog.HDTest === true ? 'Ja' : dog.HDTest === false ? 'Nein' : 'Nicht verfügbar'}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}


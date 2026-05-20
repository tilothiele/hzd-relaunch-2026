'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Box, Typography } from '@mui/material'
import type { Breeder, Dog, HzdSetting } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { BackButton } from '@/components/ui/back-button'
import { theme } from '@/themes'
import { DogDetailView } from '@/components/dog-search/dog-detail-view'
import { StudDogsList } from './stud-dogs-list'

interface StudDogDetailViewProps {
	breeder: Breeder
	strapiBaseUrl?: string | null
	hzdSetting?: HzdSetting | null
	onBack: () => void
}

function getRegionLabel(region: string | null | undefined): string {
	if (!region) {
		return '-'
	}
	return region
}

export function StudDogDetailView({
	breeder,
	strapiBaseUrl,
	hzdSetting,
	onBack,
}: StudDogDetailViewProps) {
	const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
	const member = breeder.member
	const ownerMemberNames = (breeder.owner_members ?? [])
		.map((ownerMember) =>
			[ownerMember.firstName, ownerMember.lastName].filter(Boolean).join(' ').trim()
		)
		.filter(Boolean)
	const memberName = [member?.firstName, member?.lastName]
		.filter(Boolean)
		.join(' ')
	const avatarUrl = resolveMediaUrl(
		breeder.avatar || hzdSetting?.DefaultBreederAvatar,
		strapiBaseUrl,
	) || '/static-images/placeholder/user-avatar.png'
	const ownerDocumentId = breeder.owner_members?.[0]?.documentId
	const title = ownerMemberNames.length > 0
		? ownerMemberNames.join(', ')
		: memberName || 'Deckrüdenbesitzer'

	if (selectedDog) {
		return (
			<DogDetailView
				dog={selectedDog}
				strapiBaseUrl={strapiBaseUrl}
				hzdSetting={hzdSetting}
				onBack={() => setSelectedDog(null)}
				backButtonLabel='Zurück zum Deckrüdenbesitzer'
			/>
		)
	}

	const SectionHeader = ({ title: sectionTitle }: { title: string }) => (
		<Box
			sx={{
				borderBottom: '2px solid #e5e7eb',
				pb: 1,
				mb: 3,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
			}}
		>
			<Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
				{sectionTitle}
			</Typography>
			<BackButton onClick={onBack} />
		</Box>
	)

	return (
		<div className='animate-in bg-white p-4 duration-300 fade-in md:p-8'>
			<div className='mb-8 flex flex-col items-center text-center'>
				<div
					className='relative mb-6 overflow-hidden rounded-lg border-4 border-white shadow-xl'
					style={{ width: '520px', height: '390px', maxWidth: '100%' }}
				>
					<Image
						src={avatarUrl}
						alt={title}
						fill
						className='object-cover'
						unoptimized
						sizes='(max-width: 520px) 100vw, 520px'
						priority
					/>
				</div>
				<h1 className='text-3xl font-bold text-gray-900 md:text-4xl'>
					{title}
				</h1>
			</div>

			<div className='mx-auto max-w-4xl space-y-12'>
				<section>
					<SectionHeader title='Deckrüdenbesitzer Details' />
					<div className='grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg bg-gray-50 p-6 text-gray-700 md:grid-cols-2'>
						{ownerMemberNames.length > 0 ? (
							<div>
								<strong>Deckrüdenbesitzer:</strong>
								{ownerMemberNames.map((fullName, index) => (
									<div key={`${fullName}-${index}`}>
										{fullName}
									</div>
								))}
							</div>
						) : memberName ? (
							<p>
								<strong>Deckrüdenbesitzer:</strong> {memberName}
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

						{member?.email ? (
							<p>
								<strong>E-Mail:</strong>{' '}
								<a
									href={`mailto:${member.email}`}
									className='hover:underline'
									style={{ color: theme.submitButtonColor }}
								>
									{member.email}
								</a>
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
				</section>

				{breeder.BreedersIntroduction ? (
					<section>
						<SectionHeader title='Über uns' />
						<div
							className='prose prose-lg max-w-none rounded-lg border border-gray-100 bg-white p-6 text-gray-600 shadow-sm'
							dangerouslySetInnerHTML={{ __html: breeder.BreedersIntroduction }}
						/>
					</section>
				) : null}

				{ownerDocumentId ? (
					<section>
						<SectionHeader title='Deckrüden' />
						<Box
							sx={{
								p: 2,
								bg: 'white',
								borderRadius: 2,
								border: '1px solid',
								borderColor: 'grey.100',
								boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
							}}
						>
							<StudDogsList
								ownerDocumentId={ownerDocumentId}
								strapiBaseUrl={strapiBaseUrl}
								hzdSetting={hzdSetting}
								onDogSelect={setSelectedDog}
							/>
						</Box>
					</section>
				) : null}

				<Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
					<BackButton onClick={onBack} />
				</Box>
			</div>
		</div>
	)
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Box, Typography } from '@mui/material'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { renderStrapiBlocks } from '@/lib/strapi-blocks'

interface ContactDetailProps {
	contact: {
		documentId: string
		position?: number | null
		Headline?: string | null
		Name?: string | null
		Street?: string | null
		ZipCity?: string | null
		Phone?: string | null
		Email1?: string | null
		Email2?: string | null
		Introduction?: string | null
		avatar?: {
			url: string
			alternativeText?: string | null
			width?: number | null
			height?: number | null
			caption?: string | null
			previewUrl?: string | null
		} | null
		member?: {
			documentId: string
			firstName?: string | null
			lastName?: string | null
		} | null
	}
	strapiBaseUrl: string
}

export function ContactDetail({ contact, strapiBaseUrl }: ContactDetailProps) {
	const avatarUrl = resolveMediaUrl(contact.avatar, strapiBaseUrl)
	const avatarAlt = contact.avatar?.alternativeText || contact.Name || 'Kontakt'

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
			{/* Header mit Avatar oben rechts */}
			<Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'flex-start', md: 'flex-start' } }}>
				{/* Text-Bereich links */}
				<Box sx={{ flex: 1 }}>
					{contact.Headline ? (
						<Typography variant='h4' component='h1' className='font-bold text-gray-900' sx={{ mb: 2 }}>
							{contact.Headline}
						</Typography>
					) : null}

					{contact.Name ? (
						<Typography variant='h5' component='h2' className='font-medium text-gray-900' sx={{ mb: 2 }}>
							{contact.Name}
						</Typography>
					) : null}

					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
						{contact.Street ? (
							<Typography variant='body1' className='text-gray-600'>
								{contact.Street}
							</Typography>
						) : null}

						{contact.ZipCity ? (
							<Typography variant='body1' className='text-gray-600'>
								{contact.ZipCity}
							</Typography>
						) : null}

						{contact.Phone ? (
							<Typography variant='body1' className='text-gray-600'>
								{contact.Phone.startsWith('Tel.') || contact.Phone.startsWith('Mobil')
									? contact.Phone
									: `Tel.: ${contact.Phone}`}
							</Typography>
						) : null}

						{contact.Email1 ? (
							<Typography variant='body1' className='text-gray-600'>
								{contact.Email1}
							</Typography>
						) : null}

						{contact.Email2 ? (
							<Typography variant='body1' className='text-gray-600'>
								{contact.Email2}
							</Typography>
						) : null}
					</Box>
				</Box>

				{/* Avatar oben rechts */}
				{avatarUrl ? (
					<Box
						sx={{
							position: 'relative',
							width: { xs: '100%', md: '300px' },
							aspectRatio: '4 / 3',
							flexShrink: 0,
						}}
					>
						<Image
							src={avatarUrl}
							alt={avatarAlt}
							fill
							style={{ objectFit: 'cover', borderRadius: '8px' }}
							unoptimized
						/>
					</Box>
				) : null}
			</Box>

			{/* Introduction */}
			{contact.Introduction ? (
				<Box
					sx={{
						mt: 2,
						'& p': { mb: 2 },
						'& p:last-child': { mb: 0 },
					}}
					dangerouslySetInnerHTML={{
						__html: typeof contact.Introduction === 'string'
							? contact.Introduction
							: renderStrapiBlocks(contact.Introduction),
					}}
				/>
			) : null}
		</Box>
	)
}


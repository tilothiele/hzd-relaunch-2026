'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Box, Typography } from '@mui/material'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { renderStrapiBlocks } from '@/lib/strapi-blocks'
import type { ThemeDefinition } from '@/themes'

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
	theme: ThemeDefinition
}

export function ContactDetail({ contact, strapiBaseUrl, theme }: ContactDetailProps) {
	const avatarUrl = resolveMediaUrl(contact.avatar, strapiBaseUrl)
	const avatarAlt = contact.avatar?.alternativeText || contact.Name || 'Kontakt'

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
			{/* Header mit Avatar oben rechts */}
			<Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: { xs: 'flex-start', md: 'flex-start' } }}>
				{/* Text-Bereich links */}
				<Box sx={{ flex: 1 }}>
					{contact.Headline ? (
						<Typography variant='h4' component='h1' className='font-bold' sx={{ mb: 2, color: theme.cardsText }}>
							{contact.Headline}
						</Typography>
					) : null}

					{contact.Name ? (
						<Typography variant='h5' component='h2' className='font-medium' sx={{ mb: 1, color: theme.cardsText }}>
							{contact.Name}
						</Typography>
					) : null}

					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
						{contact.Street ? (
							<Typography variant='body1' sx={{ color: theme.cardsText, opacity: 0.9 }}>
								{contact.Street}
							</Typography>
						) : null}

						{contact.ZipCity ? (
							<Typography variant='body1' sx={{ color: theme.cardsText, opacity: 0.9 }}>
								{contact.ZipCity}
							</Typography>
						) : null}

						{contact.Phone ? (
							<Typography variant='body1' sx={{ color: theme.cardsText, opacity: 0.9 }}>
								{contact.Phone.startsWith('Tel.') || contact.Phone.startsWith('Mobil')
									? contact.Phone
									: `Tel.: ${contact.Phone}`}
							</Typography>
						) : null}

						{contact.Email1 ? (
							<Typography variant='body1' sx={{ color: theme.cardsText, opacity: 0.9 }}>
								{contact.Email1}
							</Typography>
						) : null}

						{contact.Email2 ? (
							<Typography variant='body1' sx={{ color: theme.cardsText, opacity: 0.9 }}>
								{contact.Email2}
							</Typography>
						) : null}
					</Box>
				</Box>

				{/* Avatar oben rechts */}
				{avatarUrl ? (
					<Box
						sx={{
							width: { xs: '100%', md: '360px' },
							flexShrink: 0,
						}}
					>
						<Image
							src={avatarUrl}
							alt={avatarAlt}
							width={contact.avatar?.width ?? 800}
							height={contact.avatar?.height ?? 600}
							style={{
								width: '100%',
								height: 'auto',
								borderRadius: '8px'
							}}
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
						'& p': { mb: 2, color: theme.cardsText },
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





'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Box, Typography, Card, CardMedia, CardContent } from '@mui/material'
import type { ContactGroup, Contact } from '@/types'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { renderStrapiBlocks } from '@/lib/strapi-blocks'
import { theme as globalTheme, type ThemeDefinition } from '@/themes'

interface ContactGroupProps {
	contactGroup: ContactGroup
	strapiBaseUrl: string
	theme: ThemeDefinition
}

interface ContactCardProps {
	contact: Contact
	strapiBaseUrl: string
	theme: ThemeDefinition
}

function ContactCard({ contact, strapiBaseUrl, theme }: ContactCardProps) {
	const avatarUrl = resolveMediaUrl(contact.avatar, strapiBaseUrl)
	const avatarAlt = contact.avatar?.alternativeText || contact.Name || 'Kontakt'
	const hasIntroduction = !!contact.Introduction
	const contactLink = hasIntroduction ? `/contact/${contact.documentId}` : null

	const cardContent = (
		<Card
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				'&:hover': {
					boxShadow: 3,
				},
				cursor: hasIntroduction ? 'pointer' : 'default',
				backgroundColor: theme.cardsBackground,
				color: theme.cardsText,
			}}
		>
			{avatarUrl ? (
				<CardMedia
					component='div'
					sx={{
						position: 'relative',
						width: '100%',
						aspectRatio: '4 / 3',
					}}
				>
					<Image
						src={avatarUrl}
						alt={avatarAlt}
						fill
						style={{ objectFit: 'cover' }}
						unoptimized
					/>
				</CardMedia>
			) : (
				<CardMedia
					component='div'
					sx={{
						position: 'relative',
						width: '100%',
						aspectRatio: '4 / 3',
						backgroundColor: '#f3f4f6',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Typography variant='body2' sx={{ color: theme.cardsText, opacity: 0.7 }}>
						Kein Bild
					</Typography>
				</CardMedia>
			)}

			<CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
				{contact.Headline ? (
					<Typography variant='h6' component='h3' className='font-semibold' sx={{ mb: 1, color: theme.cardsText }}>
						{contact.Headline}
					</Typography>
				) : null}

				{contact.Name ? (
					<Typography
						variant='body1'
						className='font-medium'
						sx={{
							mb: .5,
							color: theme.cardsText,
							'&:hover': {
								textDecoration: contactLink ? 'underline' : 'none',
							},
						}}
					>
						{contact.Name}
					</Typography>
				) : null}

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
					{contact.Street ? (
						<Typography variant='body2' sx={{ color: theme.cardsText, opacity: 0.9 }}>
							{contact.Street}
						</Typography>
					) : null}

					{contact.ZipCity ? (
						<Typography variant='body2' sx={{ color: theme.cardsText, opacity: 0.9 }}>
							{contact.ZipCity}
						</Typography>
					) : null}

					{contact.Phone ? (
						<Typography variant='body2' sx={{ color: theme.cardsText, opacity: 0.9 }}>
							{contact.Phone.startsWith('Tel.') || contact.Phone.startsWith('Mobil')
								? contact.Phone
								: `Tel.: ${contact.Phone}`}
						</Typography>
					) : null}

					{contact.Email1 ? (
						<Typography variant='body2' sx={{ color: theme.cardsText, opacity: 0.9 }}>
							{contact.Email1}
						</Typography>
					) : null}

					{contact.Email2 ? (
						<Typography variant='body2' sx={{ color: theme.cardsText, opacity: 0.9 }}>
							{contact.Email2}
						</Typography>
					) : null}
				</Box>
			</CardContent>
		</Card>
	)

	if (contactLink) {
		return (
			<Box sx={{ height: '100%' }}>
				<Link href={contactLink} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
					{cardContent}
				</Link>
			</Box>
		)
	}

	return <Box sx={{ height: '100%' }}>{cardContent}</Box>
}

export function ContactGroupComponent({ contactGroup, strapiBaseUrl, theme }: ContactGroupProps) {
	const contacts = contactGroup.contacts || []

	// Sortiere Contacts nach position, falls vorhanden
	const sortedContacts = [...contacts].sort((a, b) => {
		const posA = a.position ?? 0
		const posB = b.position ?? 0
		return posA - posB
	})

	return (
		<Box sx={{ padding: 4 }}>
			{contactGroup.ContactGroupName ? (
				<Typography variant='h4' component='h2' className='mb-6 font-bold' sx={{ marginBottom: 4, color: theme.headlineColor }}>
					{contactGroup.ContactGroupName}
				</Typography>
			) : null}

			{contactGroup.GroupDescription ? (
				<Box
					sx={{
						mb: 4,
						'& p': { mb: 2 },
						'& p:last-child': { mb: 0 },
					}}
					dangerouslySetInnerHTML={{
						__html: typeof contactGroup.GroupDescription === 'string'
							? contactGroup.GroupDescription
							: renderStrapiBlocks(contactGroup.GroupDescription),
					}}
				/>
			) : null}

			{sortedContacts.length === 0 ? (
				<Typography variant='body1' className='text-gray-500'>
					Keine Kontakte gefunden.
				</Typography>
			) : (
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: '1fr',
							sm: 'repeat(2, 1fr)',
							md: 'repeat(3, 1fr)',
						},
						gap: 3,
					}}
				>
					{sortedContacts.map((contact) => (
						<ContactCard key={contact.documentId} contact={contact} strapiBaseUrl={strapiBaseUrl} theme={theme} />
					))}
				</Box>
			)}
		</Box>
	)
}


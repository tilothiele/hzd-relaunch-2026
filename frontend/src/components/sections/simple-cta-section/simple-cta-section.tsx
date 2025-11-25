import { Box, Paper, Typography, Container } from '@mui/material'
import type { SimpleCtaSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'

interface SimpleCtaSectionComponentProps {
	section: SimpleCtaSection
	strapiBaseUrl: string
	theme: ThemeDefinition
}

export function SimpleCtaSectionComponent({
	section,
	strapiBaseUrl,
	theme,
}: SimpleCtaSectionComponentProps) {
	const backgroundColor = section.OddEven === 'Odd' ? theme.oddBgColor : theme.evenBgColor
	const backgroundImageUrl = resolveMediaUrl(section.CtaBackgroundImage, strapiBaseUrl)
	const headline = section.CtaHeadline
	const text = section.CtaInfoText
	const actionButtons = section.CtaActionButton?.filter(
		(button): button is NonNullable<typeof button> => Boolean(button),
	) ?? []

	if (!headline && !text && actionButtons.length === 0) {
		return null
	}

	return (
		<Box
			component='section'
			sx={{
				position: 'relative',
				minHeight: '500px',
				width: '100%',
				backgroundColor: backgroundColor,
				backgroundImage: backgroundImageUrl ? `url('${backgroundImageUrl}')` : undefined,
				backgroundAttachment: backgroundImageUrl ? 'fixed' : undefined,
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
				backgroundSize: 'cover',
			}}
		>
			<Box
				sx={{
					display: 'flex',
					minHeight: '500px',
					width: '100%',
					alignItems: 'center',
					justifyContent: 'center',
					px: 2,
					py: 4,
				}}
			>
				<Container maxWidth='md'>
					<Paper
						elevation={3}
						sx={{
							width: '100%',
							borderRadius: 2,
							backgroundColor: 'rgba(255, 255, 255, 0.9)',
							px: 4,
							py: 6,
						}}
					>
						{headline ? (
							<Typography
								variant='h3'
								component='h2'
								sx={{
									mb: 3,
									fontWeight: 'bold',
									color: '#A8267D',
								}}
							>
								{headline}
							</Typography>
						) : null}

						{text ? (
							<Box
								sx={{
									mb: 4,
									textAlign: 'justify',
									color: 'text.secondary',
									'& p': {
										fontSize: '1.125rem',
										lineHeight: 1.75,
									},
									'& a': {
										color: 'primary.main',
										textDecoration: 'none',
										'&:hover': {
											textDecoration: 'underline',
										},
									},
								}}
								dangerouslySetInnerHTML={{ __html: text }}
							/>
						) : null}

						{actionButtons.length > 0 ? (
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'center',
									gap: 2,
									flexWrap: 'wrap',
								}}
							>
								{actionButtons.map((actionButton, index) => (
									<ActionButton
										key={actionButton.Link ?? index}
										actionButton={actionButton}
										theme={theme}
									/>
								))}
							</Box>
						) : null}
					</Paper>
				</Container>
			</Box>
		</Box>
	)
}


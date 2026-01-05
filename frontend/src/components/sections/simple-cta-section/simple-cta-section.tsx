import { Box, Paper, Typography, Container } from '@mui/material'
import type { SimpleCtaSection } from '@/types'
import type { ThemeDefinition } from '@/themes'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { ActionButton } from '@/components/ui/action-button'
import { SectionContainer } from '@/components/sections/section-container/section-container'

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
	const backgroundColor = theme.evenBgColor
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
		<SectionContainer
			variant='full-width'
			id={section.SimpleCtaAnchor || undefined}
			backgroundColor={backgroundColor}
		>
			<Box
				sx={{
					position: 'relative',
					minHeight: '500px',
					width: '100%',
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
								backgroundColor: 'rgba(255, 255, 255, 0.7)',
								px: 4,
								py: 4,
							}}
						>
							{headline ? (
								<h2>{headline}</h2>
							) : null}

							{text ? (
								<Box
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
										my: 2,
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
		</SectionContainer>
	)
}


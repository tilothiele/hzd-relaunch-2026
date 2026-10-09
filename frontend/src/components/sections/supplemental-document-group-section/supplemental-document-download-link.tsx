'use client'

import { Box, Button, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { trackUmamiEvent } from '@/components/analytics/track-umami-event'

interface SupplementalDocumentDownloadLinkProps {
	href: string
	fileName: string
	fileSizeLabel?: string
	buttonColor?: string
	buttonTextColor?: string
	buttonHoverColor?: string
}

const EVENT_NAME = 'supplemental-document-download'

export function SupplementalDocumentDownloadLink ({
	href,
	fileName,
	fileSizeLabel,
	buttonColor,
	buttonTextColor,
	buttonHoverColor,
}: SupplementalDocumentDownloadLinkProps) {
	const handleClick = () => {
		trackUmamiEvent(EVENT_NAME, {
			Dateiname: fileName,
		})
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
			<Button
				component='a'
				href={href}
				download={fileName || true}
				onClick={handleClick}
				variant='contained'
				size='small'
				startIcon={<DownloadIcon />}
				sx={{
					backgroundColor: buttonColor ?? 'var(--color-main-base)',
					color: buttonTextColor ?? 'var(--color-main-contrast-text)',
					fontWeight: 600,
					'&:hover': {
						backgroundColor: buttonHoverColor ?? 'var(--color-main-hover)',
					},
				}}
			>
				Download
			</Button>
			{(fileName || fileSizeLabel) && (
				<Typography
					variant='caption'
					sx={{
						mt: 0.5,
						color: 'text.secondary',
						fontSize: '0.75rem',
					}}
				>
					{fileName}
					{fileName && fileSizeLabel && ' • '}
					{fileSizeLabel}
				</Typography>
			)}
		</Box>
	)
}

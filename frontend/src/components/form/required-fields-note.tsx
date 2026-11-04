import { Typography } from '@mui/material'

interface RequiredFieldsNoteProps {
	color?: string
}

export function RequiredFieldsNote({ color }: RequiredFieldsNoteProps) {
	return (
		<Typography
			variant='body2'
			component='p'
			sx={{ color: color ?? 'text.secondary' }}
		>
			Mit * gekennzeichnete Angaben sind Pflichtfelder.
		</Typography>
	)
}

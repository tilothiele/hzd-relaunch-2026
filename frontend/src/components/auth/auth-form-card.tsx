'use client'

import { Box, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface AuthFormCardProps {
	title: string
	children: ReactNode
}

export function AuthFormCard({ title, children }: AuthFormCardProps) {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				width: '100%',
				py: 6,
			}}
		>
			<Paper
				variant='outlined'
				elevation={0}
				sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 480 }}
			>
				<Typography
					variant='h4'
					component='h1'
					sx={{ mb: 3, fontFamily: '"Roboto Slab", serif' }}
				>
					{title}
				</Typography>
				{children}
			</Paper>
		</Box>
	)
}

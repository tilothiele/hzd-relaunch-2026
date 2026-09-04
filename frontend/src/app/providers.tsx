'use client'

import type { PropsWithChildren } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { muiTheme } from '@/lib/mui-theme'
import { AuthProvider } from '@/contexts/auth-context'
import { PwaUpdater } from '@/components/pwa/pwa-updater'
import { PwaDevCleanup } from '@/components/pwa/pwa-dev-cleanup'

export function Providers({ children }: PropsWithChildren) {
	return (
		<ThemeProvider theme={muiTheme}>
			<AuthProvider>
				<PwaDevCleanup />
				{children}
				<PwaUpdater />
			</AuthProvider>
		</ThemeProvider>
	)
}

'use client'

import type { PropsWithChildren } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { SessionProvider } from 'next-auth/react'
// import CssBaseline from '@mui/material/CssBaseline'
import { muiTheme } from '@/lib/mui-theme'
import { AuthProvider } from '@/contexts/auth-context'
import { PwaUpdater } from '@/components/pwa/pwa-updater'

export function Providers({ children }: PropsWithChildren) {
	return (
		<ThemeProvider theme={muiTheme}>
			{/* <CssBaseline /> */}
			<SessionProvider>
				<AuthProvider>
					{children}
					<PwaUpdater />
				</AuthProvider>
			</SessionProvider>
		</ThemeProvider>
	)
}


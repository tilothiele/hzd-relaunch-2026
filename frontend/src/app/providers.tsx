'use client'

import type { PropsWithChildren } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { muiTheme } from '@/lib/mui-theme'
import { AuthProvider } from '@/contexts/auth-context'
import { PwaUpdater } from '@/components/pwa/pwa-updater'
import { PwaDevCleanup } from '@/components/pwa/pwa-dev-cleanup'
import { SearchConfigProvider } from '@/components/search/search-config-context'

interface ProvidersProps extends PropsWithChildren {
	searchEnabled?: boolean
}

export function Providers({ children, searchEnabled = false }: ProvidersProps) {
	return (
		<ThemeProvider theme={muiTheme}>
			<SearchConfigProvider enabled={searchEnabled}>
				<AuthProvider>
					<PwaDevCleanup />
					{children}
					<PwaUpdater />
				</AuthProvider>
			</SearchConfigProvider>
		</ThemeProvider>
	)
}

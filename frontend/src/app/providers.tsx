'use client'

import type { PropsWithChildren } from 'react'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { muiTheme } from '@/lib/mui-theme'

export function Providers({ children }: PropsWithChildren) {
	return (
		<ThemeProvider theme={muiTheme}>
			<CssBaseline />
			<ChakraProvider value={defaultSystem}>
				{children}
			</ChakraProvider>
		</ThemeProvider>
	)
}


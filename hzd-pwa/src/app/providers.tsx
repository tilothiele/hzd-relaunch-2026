'use client'

import type { PropsWithChildren } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { PwaUpdater } from '@/components/PwaUpdater'

export function Providers({ children }: PropsWithChildren) {
	return (
		<AuthProvider>
			{children}
			<PwaUpdater />
		</AuthProvider>
	)
}

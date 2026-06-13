'use client'

import type { PropsWithChildren } from 'react'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider } from '@/contexts/auth-context'

export function Providers({ children }: PropsWithChildren) {
	return (
		<SessionProvider>
			<AuthProvider>{children}</AuthProvider>
		</SessionProvider>
	)
}

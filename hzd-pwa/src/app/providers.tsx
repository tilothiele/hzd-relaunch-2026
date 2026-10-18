'use client'

import type { PropsWithChildren } from 'react'
import { AuthProvider } from '@/contexts/auth-context'

export function Providers({ children }: PropsWithChildren) {
	return <AuthProvider>{children}</AuthProvider>
}

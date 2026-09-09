'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { hasRequiredUserGroups } from '@/lib/permissions'
import type { ComponentPermissionRestriction } from '@/types'

interface AuthGuardProps {
	children: React.ReactNode
	fallback: React.ReactNode
	restriction?: ComponentPermissionRestriction | null
}

export function AuthGuard({ children, fallback, restriction }: AuthGuardProps) {
	const { user, isAuthenticated, isInitialized } = useAuth()

	if (!isInitialized) {
		return null
	}

	if (!isAuthenticated) {
		return <>{fallback}</>
	}

	if (!hasRequiredUserGroups(user, restriction?.user_groups)) {
		return <>{fallback}</>
	}

	return <>{children}</>
}

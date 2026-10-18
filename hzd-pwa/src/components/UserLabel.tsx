'use client'

import { useAuth } from '@/hooks/use-auth'
import { formatAuthDisplayName } from '@/lib/strapi-api'

export function UserLabel() {
	const { isAuthenticated, isInitialized, user } = useAuth()

	if (!isInitialized || !isAuthenticated || !user) {
		return null
	}

	return (
		<span className="max-w-[9rem] truncate text-sm font-medium sm:max-w-xs">
			{formatAuthDisplayName(user)}
		</span>
	)
}

'use client'

import { useAuth } from '@/hooks/use-auth'

export function UserLabel() {
	const { user, isInitialized } = useAuth()

	if (!isInitialized || !user?.firstName || !user?.lastName) {
		return null
	}

	return (
		<span className="text-sm font-medium hidden md:block">
			{user.firstName} {user.lastName}
		</span>
	)
}

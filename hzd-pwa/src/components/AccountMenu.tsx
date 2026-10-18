'use client'

import { LogoutButton } from '@/components/LogoutButton'
import { UserLabel } from '@/components/UserLabel'
import { useAuth } from '@/hooks/use-auth'

export function AccountMenu() {
	const { handleLogin, isAuthenticated, isInitialized } = useAuth()

	if (!isInitialized) {
		return <span className="inline-block h-10 w-28" aria-hidden="true" />
	}

	if (!isAuthenticated) {
		return (
			<button
				type="button"
				onClick={() => void handleLogin()}
				className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-kapitaensblau)] px-4 text-sm font-medium text-white hover:opacity-90"
			>
				Anmelden
			</button>
		)
	}

	return (
		<div className="flex items-center gap-3">
			<UserLabel />
			<LogoutButton />
		</div>
	)
}

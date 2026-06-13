'use client'

import { useAuth } from '@/hooks/use-auth'

export function LogoutButton() {
	const { handleLogout, isAuthenticating } = useAuth()

	return (
		<button
			type="button"
			onClick={() => void handleLogout()}
			disabled={isAuthenticating}
			className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-red-600 text-white gap-2 hover:bg-red-700 text-sm h-10 px-4 disabled:opacity-70"
		>
			{isAuthenticating ? 'Abmelden…' : 'Abmelden'}
		</button>
	)
}

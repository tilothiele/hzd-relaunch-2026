'use client'

import { useOnlineStatus } from '@/hooks/use-online-status'

export function OnlineIndicator() {
	const { isOnline, isReady } = useOnlineStatus()

	if (!isReady) {
		return (
			<span
				className="inline-flex h-3 w-3 rounded-full bg-gray-400"
				aria-hidden="true"
			/>
		)
	}

	const statusLabel = isOnline ? 'Online' : 'Offline'

	return (
		<span
			className="inline-flex items-center gap-2"
			title={statusLabel}
			aria-label={statusLabel}
		>
			<span
				className={`inline-flex h-3 w-3 rounded-full ${
					isOnline ? 'bg-green-500' : 'bg-red-500'
				}`}
				aria-hidden="true"
			/>
			<span className="text-sm font-medium hidden md:inline">
				{statusLabel}
			</span>
		</span>
	)
}

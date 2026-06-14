'use client'

import { useEffect, useState } from 'react'

export function useOnlineStatus() {
	const [isOnline, setIsOnline] = useState(true)
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		const updateStatus = () => {
			setIsOnline(navigator.onLine)
		}

		updateStatus()
		setIsReady(true)

		window.addEventListener('online', updateStatus)
		window.addEventListener('offline', updateStatus)

		return () => {
			window.removeEventListener('online', updateStatus)
			window.removeEventListener('offline', updateStatus)
		}
	}, [])

	return { isOnline, isReady }
}

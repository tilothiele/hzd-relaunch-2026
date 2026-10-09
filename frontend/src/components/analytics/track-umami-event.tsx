'use client'

import { useEffect } from 'react'

interface UmamiTracker {
	track: {
		(eventName: string, eventData?: Record<string, string | number>): void
		(): void
	}
}

declare global {
	interface Window {
		umami?: UmamiTracker
	}
}

interface TrackUmamiEventProps {
	eventName: string
	eventData: Record<string, string | number>
}

export function trackUmamiEvent (
	eventName: string,
	eventData: Record<string, string | number>,
) {
	const send = () => {
		if (typeof window.umami?.track !== 'function') {
			return false
		}
		window.umami.track(eventName, eventData)
		return true
	}

	if (send()) {
		return () => undefined
	}

	const intervalId = window.setInterval(() => {
		if (send()) {
			window.clearInterval(intervalId)
		}
	}, 250)

	const timeoutId = window.setTimeout(() => {
		window.clearInterval(intervalId)
	}, 4000)

	return () => {
		window.clearInterval(intervalId)
		window.clearTimeout(timeoutId)
	}
}

export function TrackUmamiEvent ({
	eventName,
	eventData,
}: TrackUmamiEventProps) {
	const eventDataKey = JSON.stringify(eventData)

	useEffect(() => {
		let payload: Record<string, string | number>
		try {
			payload = JSON.parse(eventDataKey) as Record<string, string | number>
		} catch {
			return
		}

		return trackUmamiEvent(eventName, payload)
	}, [eventName, eventDataKey])

	return null
}

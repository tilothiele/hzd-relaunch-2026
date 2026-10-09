'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface UmamiAnalyticsProps {
	scriptUrl?: string
	websiteId?: string
}

function isMemberAreaPath (pathname: string): boolean {
	const segment = pathname.split('/').filter(Boolean)[0]?.toLowerCase() ?? ''
	return segment === 'meine' || segment.startsWith('meine-')
}

export function UmamiAnalytics ({
	scriptUrl,
	websiteId,
}: UmamiAnalyticsProps) {
	const pathname = usePathname()

	useEffect(() => {
		if (!scriptUrl || !websiteId) {
			return
		}

		const existing = document.querySelector(
			'script[data-website-id="' + websiteId + '"]',
		)
		if (existing) {
			return
		}

		const script = document.createElement('script')
		script.src = scriptUrl
		script.defer = true
		script.dataset.websiteId = websiteId
		script.dataset.autoTrack = 'false'
		document.head.appendChild(script)
	}, [scriptUrl, websiteId])

	useEffect(() => {
		if (!scriptUrl || !websiteId || !pathname || isMemberAreaPath(pathname)) {
			return
		}

		let cancelled = false

		const send = () => {
			if (cancelled || typeof window.umami?.track !== 'function') {
				return false
			}
			window.umami.track()
			return true
		}

		if (send()) {
			return
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
			cancelled = true
			window.clearInterval(intervalId)
			window.clearTimeout(timeoutId)
		}
	}, [pathname, scriptUrl, websiteId])

	return null
}

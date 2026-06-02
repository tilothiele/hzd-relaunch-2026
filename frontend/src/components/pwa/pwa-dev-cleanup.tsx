'use client'

import { useEffect } from 'react'

/**
 * In der Entwicklung generiert Serwist keinen neuen SW (next.config disable),
 * aber ein alter public/sw.js kann im Browser noch registriert sein und
 * veraltete _next/static-Chunks precachen → 404 / bad-precaching-response.
 */
export function PwaDevCleanup() {
	useEffect(() => {
		if (process.env.NODE_ENV !== 'development') {
			return
		}

		if (!('serviceWorker' in navigator)) {
			return
		}

		void (async () => {
			const registrations = await navigator.serviceWorker.getRegistrations()
			await Promise.all(registrations.map((registration) => registration.unregister()))

			if ('caches' in window) {
				const cacheKeys = await caches.keys()
				await Promise.all(
					cacheKeys
						.filter((key) => key.includes('serwist') || key.includes('precache'))
						.map((key) => caches.delete(key)),
				)
			}
		})()
	}, [])

	return null
}

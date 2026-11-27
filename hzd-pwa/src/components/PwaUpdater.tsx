'use client'

import { useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import CloseIcon from '@/components/icons/close-icon'

/**
 * Prüft, ob die installierte Service Worker-Version hinter der aktuell
 * ausgelieferten Version herhinkt (analog frontend/src/components/pwa/pwa-updater.tsx).
 *
 * - Der SW wartet (skipWaiting: false) und wird erst aktiv, wenn der Nutzer
 *   „Aktualisieren" tippt (Message „SKIP_WAITING" an den SW).
 * - Danach übernimmt der neue SW (clientsClaim: true) → controllerchange → Reload.
 * - NUR im Online-Modus aktiv: offline wird kein Banner gezeigt und es wird
 *   nicht neu geladen — der Offline-Modus bleibt unbeaufsichtigt nutzbar.
 */
export function PwaUpdater() {
	const { isOnline, isReady } = useOnlineStatus()
	const [updatePending, setUpdatePending] = useState(false)
	const [dismissed, setDismissed] = useState(false)
	const updateRequested = useRef(false)
	const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

	useEffect(() => {
		if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
			return
		}

		const rememberWaiting = (reg: ServiceWorkerRegistration) => {
			registrationRef.current = reg
			// Bereits wartender Worker (z. B. Update aus einer früheren Sitzung).
			if (reg.waiting) {
				setUpdatePending(true)
			}

			// Neue Updates, die während dieser Sitzung entdeckt werden.
			reg.addEventListener('updatefound', () => {
				const worker = reg.installing
				if (!worker) {
					return
				}
				worker.addEventListener('statechange', () => {
					if (
						worker.state === 'installed'
						&& navigator.serviceWorker.controller
					) {
						setUpdatePending(true)
					}
				})
			})
		}

		navigator.serviceWorker.getRegistration().then((reg) => {
			if (reg) {
				rememberWaiting(reg)
			}
		})

		// Nach bestätigtem Update übernimmt der neue Worker → Seite neu laden.
		// Nur, wenn wir das Update selbst ausgelöst haben UND online sind
		// (offline muss der laufende Offline-Modus nicht abgerissen werden).
		const onControllerChange = () => {
			if (!updateRequested.current) {
				return
			}
			if (!navigator.onLine) {
				return
			}
			updateRequested.current = false
			window.location.reload()
		}

		navigator.serviceWorker.addEventListener(
			'controllerchange',
			onControllerChange,
		)

		return () => {
			navigator.serviceWorker.removeEventListener(
				'controllerchange',
				onControllerChange,
			)
		}
	}, [])

	const handleUpdate = () => {
		const reg = registrationRef.current
		if (reg?.waiting) {
			updateRequested.current = true
			reg.waiting.postMessage({ type: 'SKIP_WAITING' })
		} else if (navigator.onLine) {
			// Fallback: bekanntermaßen Update da, aber kein reachable Worker mehr.
			window.location.reload()
		}
	}

	const showUpdate = isReady && isOnline && updatePending && !dismissed

	if (!showUpdate) {
		return null
	}

	return (
		<div
			className="fixed bottom-4 left-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 sm:bottom-8"
			role="status"
			aria-live="polite"
		>
			<div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
				<div className="min-w-0">
					<p className="text-sm font-semibold text-gray-900 dark:text-white">
						Neue Version verfügbar!
					</p>
					<p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
						Ein Update für die HZD App ist bereit.
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<button
						type="button"
						onClick={handleUpdate}
						className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
					>
						Aktualisieren
					</button>
					<button
						type="button"
						onClick={() => setDismissed(true)}
						aria-label="Banner ausblenden"
						className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
					>
						<CloseIcon className="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	)
}

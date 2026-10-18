'use client'

import { useEffect, useRef } from 'react'
import type { AltchaWidgetElement } from 'altcha'

interface AltchaFieldProps {
	onVerifiedChange: (verified: boolean) => void
	resetSignal?: number
}

export function AltchaField({
	onVerifiedChange,
	resetSignal = 0,
}: AltchaFieldProps) {
	const hostRef = useRef<HTMLDivElement>(null)
	const widgetRef = useRef<AltchaWidgetElement | null>(null)
	const onChangeRef = useRef(onVerifiedChange)
	onChangeRef.current = onVerifiedChange

	useEffect(() => {
		const host = hostRef.current
		if (!host) {
			return undefined
		}

		let cancelled = false

		void (async () => {
			await import('altcha')
			await import('altcha/i18n/de')
			if (cancelled || !hostRef.current) {
				return
			}

			const widget = document.createElement('altcha-widget') as AltchaWidgetElement
			widget.setAttribute('challenge', '/api/altcha/challenge')
			widget.setAttribute('language', 'de')
			widget.setAttribute('auto', 'off')
			widget.style.setProperty('--altcha-max-width', '100%')
			widget.addEventListener('statechange', (event) => {
				const state = (event as CustomEvent<{ state?: string }>).detail?.state
				onChangeRef.current(state === 'verified')
			})
			host.replaceChildren(widget)
			widgetRef.current = widget
			await new Promise((resolve) => {
				requestAnimationFrame(() => resolve(undefined))
			})
			if (cancelled || !host.contains(widget)) {
				return
			}
			await widget.configure({
				challenge: '/api/altcha/challenge',
				language: 'de',
				auto: 'off',
				humanInteractionSignature: false,
			})
		})()

		return () => {
			cancelled = true
			widgetRef.current = null
			host.replaceChildren()
		}
	}, [])

	useEffect(() => {
		if (resetSignal === 0) {
			return
		}
		widgetRef.current?.reset()
		onChangeRef.current(false)
	}, [resetSignal])

	return (
		<div
			ref={hostRef}
			style={{ width: '100%', maxWidth: '100%' }}
		/>
	)
}

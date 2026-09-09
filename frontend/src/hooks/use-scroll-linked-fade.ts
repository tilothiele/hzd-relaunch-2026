'use client'

import { useLayoutEffect, useRef, useState } from 'react'

const DEFAULT_FADE_DISTANCE_VH = 30

function prefersReducedMotion() {
	if (typeof window === 'undefined' || !window.matchMedia) {
		return false
	}

	return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useScrollLinkedFade(fadeDistanceVh = DEFAULT_FADE_DISTANCE_VH) {
	const elementRef = useRef<HTMLDivElement>(null)
	const [opacity, setOpacity] = useState(1)

	useLayoutEffect(() => {
		const element = elementRef.current
		if (!element) {
			return
		}

		if (prefersReducedMotion()) {
			setOpacity(1)
			return
		}

		let frame = 0

		const update = () => {
			const rect = element.getBoundingClientRect()
			const viewportHeight = window.innerHeight
			const fadeDistancePx = Math.max(
				1,
				(fadeDistanceVh / 100) * viewportHeight,
			)
			const enteredPx = viewportHeight - rect.top
			const nextOpacity = Math.min(
				1,
				Math.max(0, enteredPx / fadeDistancePx),
			)
			const roundedOpacity = Math.round(nextOpacity * 100) / 100

			setOpacity((current) => (
				current === roundedOpacity ? current : roundedOpacity
			))
		}

		const scheduleUpdate = () => {
			if (frame) {
				return
			}

			frame = window.requestAnimationFrame(() => {
				frame = 0
				update()
			})
		}

		update()
		window.addEventListener('scroll', scheduleUpdate, { passive: true })
		window.addEventListener('resize', scheduleUpdate)

		return () => {
			window.removeEventListener('scroll', scheduleUpdate)
			window.removeEventListener('resize', scheduleUpdate)
			if (frame) {
				window.cancelAnimationFrame(frame)
			}
		}
	}, [fadeDistanceVh])

	return { elementRef, opacity }
}

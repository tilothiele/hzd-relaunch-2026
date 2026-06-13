'use client'

import { useEffect, useRef } from 'react'

interface SignatureCanvasProps {
	id: string
	label: string
}

export function SignatureCanvas({ id, label }: SignatureCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		let drawing = false
		let lastX = 0
		let lastY = 0

		const getPos = (e: MouseEvent | TouchEvent) => {
			const rect = canvas.getBoundingClientRect()
			const scaleX = canvas.width / rect.width
			const scaleY = canvas.height / rect.height

			if ('touches' in e) {
				return {
					x: (e.touches[0].clientX - rect.left) * scaleX,
					y: (e.touches[0].clientY - rect.top) * scaleY,
				}
			}

			return {
				x: (e.clientX - rect.left) * scaleX,
				y: (e.clientY - rect.top) * scaleY,
			}
		}

		const resize = () => {
			const rect = canvas.parentElement?.getBoundingClientRect()
			if (!rect) return
			canvas.width = rect.width
			canvas.height = 120
			ctx.strokeStyle = '#1a1714'
			ctx.lineWidth = 2
			ctx.lineCap = 'round'
			ctx.lineJoin = 'round'
		}

		const handleStart = (e: MouseEvent | TouchEvent) => {
			if ('touches' in e) e.preventDefault()
			drawing = true
			const p = getPos(e)
			lastX = p.x
			lastY = p.y
		}

		const handleMove = (e: MouseEvent | TouchEvent) => {
			if ('touches' in e) e.preventDefault()
			if (!drawing) return
			const p = getPos(e)
			ctx.beginPath()
			ctx.moveTo(lastX, lastY)
			ctx.lineTo(p.x, p.y)
			ctx.stroke()
			lastX = p.x
			lastY = p.y
		}

		const handleEnd = () => {
			drawing = false
		}

		resize()
		window.addEventListener('resize', resize)
		canvas.addEventListener('mousedown', handleStart)
		canvas.addEventListener('mousemove', handleMove)
		canvas.addEventListener('mouseup', handleEnd)
		canvas.addEventListener('mouseleave', handleEnd)
		canvas.addEventListener('touchstart', handleStart, { passive: false })
		canvas.addEventListener('touchmove', handleMove, { passive: false })
		canvas.addEventListener('touchend', handleEnd)

		return () => {
			window.removeEventListener('resize', resize)
			canvas.removeEventListener('mousedown', handleStart)
			canvas.removeEventListener('mousemove', handleMove)
			canvas.removeEventListener('mouseup', handleEnd)
			canvas.removeEventListener('mouseleave', handleEnd)
			canvas.removeEventListener('touchstart', handleStart)
			canvas.removeEventListener('touchmove', handleMove)
			canvas.removeEventListener('touchend', handleEnd)
		}
	}, [id])

	const handleClear = () => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		ctx.clearRect(0, 0, canvas.width, canvas.height)
	}

	return (
		<div className="wa-sig-container">
			<canvas ref={canvasRef} id={id} className="wa-sig-canvas" />
			<div className="wa-sig-toolbar">
				<span className="wa-sig-label">{label}</span>
				<button type="button" className="wa-btn-clear" onClick={handleClear}>
					Löschen
				</button>
			</div>
		</div>
	)
}

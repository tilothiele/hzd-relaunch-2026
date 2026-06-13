'use client'

import { useCallback, useEffect, useRef } from 'react'

interface SignatureCanvasProps {
	id: string
	label: string
	value?: string
	onChange?: (dataUrl: string) => void
}

export function SignatureCanvas({
	id,
	label,
	value = '',
	onChange,
}: SignatureCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const valueRef = useRef(value)
	const drawingRef = useRef(false)

	const redrawFromValue = useCallback((dataUrl: string) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.strokeStyle = '#1a1714'
		ctx.lineWidth = 2
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'

		if (!dataUrl) return

		const image = new Image()
		image.onload = () => {
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
		}
		image.src = dataUrl
	}, [])

	const notifyChange = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas || !onChange) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
		const hasInk = pixels.some((channel, index) => {
			return index % 4 === 3 && channel > 0
		})

		const dataUrl = hasInk ? canvas.toDataURL('image/png') : ''
		valueRef.current = dataUrl
		onChange(dataUrl)
	}, [onChange])

	useEffect(() => {
		valueRef.current = value
		if (!drawingRef.current) {
			redrawFromValue(value)
		}
	}, [value, redrawFromValue])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

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
			const savedValue = valueRef.current
			const rect = canvas.parentElement?.getBoundingClientRect()
			if (!rect) return
			canvas.width = rect.width
			canvas.height = 120
			ctx.strokeStyle = '#1a1714'
			ctx.lineWidth = 2
			ctx.lineCap = 'round'
			ctx.lineJoin = 'round'
			redrawFromValue(savedValue)
		}

		const handleStart = (e: MouseEvent | TouchEvent) => {
			if ('touches' in e) e.preventDefault()
			drawingRef.current = true
			const p = getPos(e)
			lastX = p.x
			lastY = p.y
		}

		const handleMove = (e: MouseEvent | TouchEvent) => {
			if ('touches' in e) e.preventDefault()
			if (!drawingRef.current) return
			const p = getPos(e)
			ctx.beginPath()
			ctx.moveTo(lastX, lastY)
			ctx.lineTo(p.x, p.y)
			ctx.stroke()
			lastX = p.x
			lastY = p.y
		}

		const handleEnd = () => {
			if (!drawingRef.current) return
			drawingRef.current = false
			notifyChange()
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
	}, [id, notifyChange, redrawFromValue])

	const handleClear = () => {
		valueRef.current = ''
		redrawFromValue('')
		onChange?.('')
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

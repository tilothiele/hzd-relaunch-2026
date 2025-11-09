'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'cookie-consent'

export function CookieBanner() {
	const [isVisible, setIsVisible] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		try {
			const storedValue = localStorage.getItem(STORAGE_KEY)
			if (!storedValue) {
				setIsVisible(true)
			}
		} catch (error) {
			console.error('Cookie consent Lesen fehlgeschlagen:', error)
			setIsVisible(true)
		}
	}, [])

	const handleAccept = useCallback(() => {
		try {
			setIsSaving(true)
			localStorage.setItem(STORAGE_KEY, 'accepted')
			setIsVisible(false)
		} catch (error) {
			console.error('Cookie consent Speichern fehlgeschlagen:', error)
		} finally {
			setIsSaving(false)
		}
	}, [])

	const handleReject = useCallback(() => {
		try {
			setIsSaving(true)
			localStorage.setItem(STORAGE_KEY, 'rejected')
			setIsVisible(false)
		} catch (error) {
			console.error('Cookie Ablehnung Speichern fehlgeschlagen:', error)
		} finally {
			setIsSaving(false)
		}
	}, [])

	if (!isVisible) {
		return null
	}

	return (
		<div className='fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4'>
			<div className='w-full max-w-3xl rounded-lg bg-[#64574E] p-5 text-white shadow-2xl'>
				<h2 className='text-lg font-semibold text-yellow-300'>
					Cookies & Datenschutz
				</h2>
				<p className='mt-2 text-sm leading-relaxed text-gray-100'>
					Wir verwenden Cookies, um Funktionen zu ermöglichen und Statistiken zu erheben. 
					Sie können Ihre Entscheidung jederzeit in den Cookie-Einstellungen anpassen.
				</p>
				<div className='mt-4 flex flex-wrap gap-3'>
					<button
						type='button'
						onClick={handleAccept}
						disabled={isSaving}
						className='rounded bg-yellow-400 px-4 py-2 text-sm font-semibold text-[#3d2817]
							transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isSaving ? 'Speichern…' : 'Alle akzeptieren'}
					</button>
					<button
						type='button'
						onClick={handleReject}
						disabled={isSaving}
						className='rounded border border-white px-4 py-2 text-sm font-semibold text-white
							transition-colors hover:bg-white hover:text-[#3d2817] disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isSaving ? 'Speichern…' : 'Nur notwendige Cookies'}
					</button>
					<button
						type='button'
						className='ml-auto text-sm underline underline-offset-4 transition-colors hover:text-yellow-300'
					>
						Cookie-Einstellungen
					</button>
				</div>
			</div>
		</div>
	)
}


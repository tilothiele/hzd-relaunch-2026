'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useGlobalLayout } from '@/hooks/use-global-layout'
import { resolveMediaUrl } from '@/components/header/logo-utils'

import { useCookieConsent } from '@/hooks/use-cookie-consent'

export function CookieBanner() {
	const { globalLayout, baseUrl } = useGlobalLayout()
	const { status, accept, reject, isUndecided } = useCookieConsent()
	const privacyPolicyUrl = resolveMediaUrl(globalLayout?.PrivacyPolicy ?? null, baseUrl)
	const [isSaving, setIsSaving] = useState(false)

	const handleAccept = useCallback(() => {
		setIsSaving(true)
		accept()
		setIsSaving(false)
	}, [accept])

	const handleReject = useCallback(() => {
		setIsSaving(true)
		reject()
		setIsSaving(false)
	}, [reject])

	if (!isUndecided) {
		return null
	}

	return (
		<div className='fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4'>
			<div
				className='w-full max-w-3xl rounded-md bg-white shadow-lg'
				style={{
					padding: '1.5em',
					border: '3px solid #e5e7eb',
					borderRadius: '8px',
				}}
			>
				<h2 className='text-lg font-semibold text-gray-900'>
					Cookies & Datenschutz
				</h2>
				<p className='mt-2 text-sm leading-relaxed text-gray-700'>
					Wir verwenden Cookies, um Funktionen zu ermöglichen und Statistiken zu erheben.
					Sie können Ihre Entscheidung jederzeit in den Cookie-Einstellungen anpassen.
					{privacyPolicyUrl ? (
						<>
							{' '}
							<Link
								href={privacyPolicyUrl}
								target='_blank'
								rel='noopener noreferrer'
								className='text-gray-700 underline underline-offset-4 transition-colors hover:text-gray-900'
							>
								Lesen Sie bitteunsere Datenschutzerklärung
							</Link>
						</>
					) : null}
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
						className='rounded border border-gray-400 px-4 py-2 text-sm font-semibold text-gray-700
							transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isSaving ? 'Speichern…' : 'Nur notwendige Cookies'}
					</button>
				</div>
			</div>
		</div>
	)
}


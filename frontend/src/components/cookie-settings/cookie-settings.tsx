'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useGlobalLayout } from '@/hooks/use-global-layout'
import { resolveMediaUrl } from '@/components/header/logo-utils'
import { theme } from '@/themes'
import { useCookieConsent, type ConsentStatus } from '@/hooks/use-cookie-consent'
import { COOKIE_CONSENT } from '@/components/cookie-consent/cookie-consent-texts'

const LINK_CLASS = 'text-gray-700 underline underline-offset-4 transition-colors hover:text-gray-900'

const STATUS_CONFIG: Record<ConsentStatus, {
	label: string
	dotClass: string
	boxClass: string
}> = {
	accepted: {
		label: 'Aktuelle Auswahl: Alle akzeptiert',
		dotClass: 'bg-green-500',
		boxClass: 'bg-green-50 text-green-700 border-green-200',
	},
	rejected: {
		label: 'Aktuelle Auswahl: keine externen Inhalte',
		dotClass: 'bg-gray-400',
		boxClass: 'bg-gray-50 text-gray-700 border-gray-200',
	},
	undecided: {
		label: 'Noch keine Entscheidung getroffen',
		dotClass: 'bg-amber-500',
		boxClass: 'bg-amber-50 text-amber-700 border-amber-200',
	},
}

const BASE_BUTTON = 'rounded border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

export function CookieSettings() {
	const { globalLayout, baseUrl } = useGlobalLayout()
	const { status, accept, reject } = useCookieConsent()
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

	const statusConfig = STATUS_CONFIG[status]
	const acceptIsCurrent = status === 'accepted'
	const rejectIsCurrent = status === 'rejected'

	const buttonStyle = (isCurrent: boolean) => ({
		backgroundColor: isCurrent ? theme.submitButtonColor : 'transparent',
		color: isCurrent ? theme.submitButtonTextColor : '#374151',
		borderColor: isCurrent ? theme.submitButtonColor : 'var(--color-border, #d1d5db)',
	})

	return (
		<div className="mx-auto w-full max-w-3xl mt-4">
			<div
				className="rounded-md bg-white shadow-sm"
				style={{
					padding: '1.5em',
					border: '3px solid #e5e7eb',
					borderRadius: '8px',
				}}
			>
				<h2 className="text-lg font-semibold text-gray-900">
					{COOKIE_CONSENT.title}
				</h2>

				<div
					role="status"
					aria-live="polite"
					className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${statusConfig.boxClass}`}
				>
					<span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotClass}`} aria-hidden="true" />
					{statusConfig.label}
				</div>

				<p className="mt-3 text-sm leading-relaxed text-gray-700">
					{COOKIE_CONSENT.body}
					{privacyPolicyUrl ? (
						<>
							{' '}
							<Link
								href={privacyPolicyUrl}
								target="_blank"
								rel="noopener noreferrer"
								className={LINK_CLASS}
							>
								{COOKIE_CONSENT.privacyLinkLabel}
							</Link>
						</>
					) : null}
					{' '}
					·{' '}
					<Link
						href={COOKIE_CONSENT.impressum.href}
						className={LINK_CLASS}
					>
						{COOKIE_CONSENT.impressum.label}
					</Link>
				</p>

				<div className="mt-4 flex flex-wrap gap-3">
					<button
						type="button"
						onClick={handleAccept}
						disabled={isSaving}
						className={`${BASE_BUTTON} ${acceptIsCurrent ? 'ring-2 ring-offset-1' : 'hover:bg-gray-100'}`}
						style={buttonStyle(acceptIsCurrent)}
					>
						{isSaving ? 'Speichern…' : COOKIE_CONSENT.acceptLabel}
					</button>
					<button
						type="button"
						onClick={handleReject}
						disabled={isSaving}
						className={`${BASE_BUTTON} ${rejectIsCurrent ? 'ring-2 ring-offset-1' : 'hover:bg-gray-100'}`}
						style={buttonStyle(rejectIsCurrent)}
					>
						{isSaving ? 'Speichern…' : COOKIE_CONSENT.rejectLabel}
					</button>
				</div>
			</div>
		</div>
	)
}

'use client'

import { Suspense, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
	DatenschutzPage,
	StammblattPage,
	WelpePage,
} from './WurfabnahmePages'
import {
	parseWurfabnahmePage,
} from './constants'
import { applyNamedFields } from '@/lib/wurfabnahme-form-serialize'
import type { WurfabnahmeFormData } from '@/types/wurfabnahme-form'
import './wurfabnahme.css'

interface WurfabnahmeAppProps {
	basePath: string
	formData: WurfabnahmeFormData
	onFormDataChange: (data: WurfabnahmeFormData) => void
	formRef: React.RefObject<HTMLDivElement | null>
}

function WurfabnahmeAppInner({
	formData,
	onFormDataChange,
	formRef,
}: WurfabnahmeAppProps) {
	const searchParams = useSearchParams()
	const fieldsAppliedRef = useRef<string>('')

	const activePage = parseWurfabnahmePage(searchParams.get('seite'))

	const handleStammblattChange = useCallback(
		(stammblatt: WurfabnahmeFormData['stammblatt']) => {
			onFormDataChange({
				...formData,
				stammblatt,
			})
		},
		[formData, onFormDataChange],
	)

	const handleSignatureChange = useCallback(
		(id: string, dataUrl: string) => {
			onFormDataChange({
				...formData,
				signatures: {
					...formData.signatures,
					[id]: dataUrl,
				},
			})
		},
		[formData, onFormDataChange],
	)

	const signatureProps = {
		signatures: formData.signatures,
		onSignatureChange: handleSignatureChange,
	}

	useEffect(() => {
		const root = formRef.current
		if (!root) return

		const key = `${activePage}:${JSON.stringify(formData.fields)}`
		if (fieldsAppliedRef.current === key) return

		applyNamedFields(root, formData.fields)
		fieldsAppliedRef.current = key
	}, [activePage, formData.fields, formRef])

	return (
		<div className="wurfabnahme-app" ref={formRef}>
			{activePage === 'stammblatt' && (
				<StammblattPage
					data={formData.stammblatt}
					onChange={handleStammblattChange}
					{...signatureProps}
				/>
			)}

			{activePage === 'welpe1' && <WelpePage {...signatureProps} />}

			{activePage === 'datenschutz1' && (
				<DatenschutzPage {...signatureProps} />
			)}
		</div>
	)
}

export default function WurfabnahmeApp(props: WurfabnahmeAppProps) {
	return (
		<Suspense fallback={<p>Lade Wurfabnahme…</p>}>
			<WurfabnahmeAppInner {...props} />
		</Suspense>
	)
}

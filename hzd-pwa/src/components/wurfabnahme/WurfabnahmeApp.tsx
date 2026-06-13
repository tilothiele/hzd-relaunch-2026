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
	readOnly?: boolean
	deletedWelpenIds?: Set<string>
	onMarkWelpeDelete?: (id: string) => void
	onUndoWelpeDelete?: (id: string) => void
}

function WurfabnahmeAppInner({
	formData,
	onFormDataChange,
	formRef,
	readOnly = false,
	deletedWelpenIds = new Set(),
	onMarkWelpeDelete,
	onUndoWelpeDelete,
}: WurfabnahmeAppProps) {
	const searchParams = useSearchParams()
	const fieldsAppliedRef = useRef<string>('')

	const activePage = parseWurfabnahmePage(searchParams.get('seite'))

	const handleStammblattChange = useCallback(
		(stammblatt: WurfabnahmeFormData['stammblatt']) => {
			if (readOnly) return
			onFormDataChange({
				...formData,
				stammblatt,
			})
		},
		[formData, onFormDataChange, readOnly],
	)

	const handleSignatureChange = useCallback(
		(id: string, dataUrl: string) => {
			if (readOnly) return
			onFormDataChange({
				...formData,
				signatures: {
					...formData.signatures,
					[id]: dataUrl,
				},
			})
		},
		[formData, onFormDataChange, readOnly],
	)

	const signatureProps = {
		signatures: formData.signatures,
		onSignatureChange: handleSignatureChange,
		readOnly,
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
		<fieldset
			disabled={readOnly}
			className="min-w-0 border-0 p-0 m-0"
		>
			<div className="wurfabnahme-app" ref={formRef}>
				{activePage === 'stammblatt' && (
					<StammblattPage
						data={formData.stammblatt}
						onChange={handleStammblattChange}
						deletedIds={deletedWelpenIds}
						onMarkDelete={onMarkWelpeDelete}
						onUndoDelete={onUndoWelpeDelete}
						{...signatureProps}
					/>
				)}

				{activePage === 'welpe1' && <WelpePage {...signatureProps} />}

				{activePage === 'datenschutz1' && (
					<DatenschutzPage {...signatureProps} />
				)}
			</div>
		</fieldset>
	)
}

export default function WurfabnahmeApp(props: WurfabnahmeAppProps) {
	return (
		<Suspense fallback={<p>Lade Wurfabnahme…</p>}>
			<WurfabnahmeAppInner {...props} />
		</Suspense>
	)
}

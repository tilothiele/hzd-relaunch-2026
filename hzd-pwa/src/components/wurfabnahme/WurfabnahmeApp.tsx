'use client'

import { Suspense, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
	DatenschutzPage,
	StammblattPage,
	WelpePage,
} from './WurfabnahmePages'
import { parseWurfabnahmePage } from './constants'
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
	activeTab: string
	onTabChange: (tab: string) => void
}

function WurfabnahmeAppInner({
	formData,
	onFormDataChange,
	formRef,
	readOnly = false,
	deletedWelpenIds = new Set(),
	onMarkWelpeDelete,
	onUndoWelpeDelete,
	activeTab,
	onTabChange,
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

	const handleWelpeChange = useCallback(
		(welpeIndex: number, data: WurfabnahmeFormData['stammblatt']['welpen'][number]) => {
			if (readOnly) return
			const newWelpen = [...formData.stammblatt.welpen]
			newWelpen[welpeIndex] = data
			onFormDataChange({
				...formData,
				stammblatt: {
					...formData.stammblatt,
					welpen: newWelpen,
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

	const showPage = (tab: string) => {
		if (tab === 'stammblatt') return activeTab === 'stammblatt'
		if (tab === 'datenschutz1') return activeTab === 'datenschutz1'
		return activeTab.startsWith('welpe-')
	}

	const activeWelpeId = activeTab.startsWith('welpe-')
		? activeTab.replace('welpe-', '')
		: null
	const activeWelpeIdx = activeWelpeId
		? formData.stammblatt.welpen.findIndex(w => w.id === activeWelpeId)
		: -1
	const activeWelpe = activeWelpeIdx >= 0
		? formData.stammblatt.welpen[activeWelpeIdx]
		: null

	useEffect(() => {
		const root = formRef.current
		if (!root) return

		const key = `${activeTab}`
		if (fieldsAppliedRef.current === key) return

		fieldsAppliedRef.current = key
	}, [activeTab, formRef])

	return (
		<fieldset
			disabled={readOnly}
			className="min-w-0 border-0 p-0 m-0"
		>
			<div className="wurfabnahme-app" ref={formRef}>
				{showPage('stammblatt') && (
					<StammblattPage
						data={formData.stammblatt}
						onChange={handleStammblattChange}
						deletedIds={deletedWelpenIds}
						onMarkDelete={onMarkWelpeDelete}
						onUndoDelete={onUndoWelpeDelete}
						{...signatureProps}
					/>
				)}

				{showPage('welpe1') && (
					<WelpePage
						welpe={activeWelpe}
						onChange={activeWelpe ? (data) => handleWelpeChange(activeWelpeIdx, data) : undefined}
						{...signatureProps}
					/>
				)}

				{showPage('datenschutz1') && (
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

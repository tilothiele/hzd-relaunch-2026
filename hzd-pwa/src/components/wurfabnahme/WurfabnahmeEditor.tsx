'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import WurfabnahmeApp from '@/components/wurfabnahme/WurfabnahmeApp'
import { mergeFormDataFromDom } from '@/lib/wurfabnahme-form-serialize'
import { getWurfabnahme, saveWurfabnahme } from '@/services/wurfabnahme-db'
import {
	appendWurfabnahmeRecord,
	buildRecordFromForm,
	cloneFormDataForEdit,
	createEmptyFormData,
	createWurfabnahme,
	getLatestWurfabnahmeRecord,
	getWurfabnahmeHistoryRecords,
	getWurfabnahmeRecordLabel,
	normalizeFormData,
	type Wurfabnahme,
	type WurfabnahmeFormData,
} from '@/types/wurfabnahme-form'

const CURRENT_DRAFT_VALUE = 'draft'

interface WurfabnahmeEditorProps {
	basePath: string
	recordId?: string
}

export function WurfabnahmeEditor({
	basePath,
	recordId,
}: WurfabnahmeEditorProps) {
	const router = useRouter()
	const formRef = useRef<HTMLDivElement>(null)
	const isNewForm = !recordId
	const [formData, setFormData] = useState<WurfabnahmeFormData>(
		createEmptyFormData,
	)
	const [draftFormData, setDraftFormData] = useState<WurfabnahmeFormData>(
		createEmptyFormData,
	)
	const [wurfabnahme, setWurfabnahme] = useState<Wurfabnahme | null>(null)
	const [selectedHistoryValue, setSelectedHistoryValue] = useState(
		CURRENT_DRAFT_VALUE,
	)
	const [isLoading, setIsLoading] = useState(Boolean(recordId))
	const [isSaving, setIsSaving] = useState(false)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [deletedWelpenIds, setDeletedWelpenIds] = useState<Set<string>>(
		new Set(),
	)

	const isViewingHistory = selectedHistoryValue !== CURRENT_DRAFT_VALUE
	const isReadOnly = !isNewForm && isViewingHistory
	const showHistorySelect = Boolean(
		wurfabnahme && wurfabnahme.records.length > 0,
	)

	const syncDraftFromDom = useCallback((): WurfabnahmeFormData => {
		if (!formRef.current) return draftFormData
		return mergeFormDataFromDom(draftFormData, formRef.current)
	}, [draftFormData])

	const handleFormDataChange = useCallback(
		(data: WurfabnahmeFormData) => {
			setFormData(data)
			if (!isViewingHistory) {
				setDraftFormData(data)
			}
		},
		[isViewingHistory],
	)

	useEffect(() => {
		if (!recordId) {
			setIsLoading(false)
			return
		}

		let cancelled = false

		getWurfabnahme(recordId).then((loaded) => {
			if (cancelled) return

			if (!loaded || loaded.records.length === 0) {
				setLoadError('Wurfabnahme nicht gefunden.')
				setIsLoading(false)
				return
			}

			const draft = cloneFormDataForEdit(
				getLatestWurfabnahmeRecord(loaded).formData,
			)

			setWurfabnahme(loaded)
			setDraftFormData(draft)
			setFormData(draft)
			setSelectedHistoryValue(CURRENT_DRAFT_VALUE)
			setIsLoading(false)
		})

		return () => {
			cancelled = true
		}
	}, [recordId])

	const handleHistoryChange = useCallback(
		(value: string) => {
			if (!wurfabnahme) return

			if (value === CURRENT_DRAFT_VALUE) {
				const draft = isViewingHistory
					? draftFormData
					: syncDraftFromDom()
				setDraftFormData(draft)
				setFormData(draft)
				setSelectedHistoryValue(CURRENT_DRAFT_VALUE)
				return
			}

			if (!isViewingHistory) {
				setDraftFormData(syncDraftFromDom())
			}

			const historicalRecord = wurfabnahme.records.find(
				(record) => record.id === value,
			)
			if (historicalRecord) {
				setFormData(normalizeFormData(historicalRecord.formData))
				setSelectedHistoryValue(value)
			}
		},
		[wurfabnahme, isViewingHistory, draftFormData, syncDraftFromDom],
	)

	const handleCancel = useCallback(() => {
		router.push('/wurfabnahmen')
	}, [router])

	const handleMarkWelpeDelete = useCallback((id: string) => {
		setDeletedWelpenIds((prev) => new Set([...prev, id]))
	}, [])

	const handleUndoWelpeDelete = useCallback((id: string) => {
		setDeletedWelpenIds((prev) => {
			const next = new Set(prev)
			next.delete(id)
			return next
		})
	}, [])

	const handleSave = useCallback(async () => {
		if (!formRef.current || isReadOnly) return

		setIsSaving(true)

		try {
			let merged = mergeFormDataFromDom(
				isNewForm ? formData : syncDraftFromDom(),
				formRef.current,
			)

			if (deletedWelpenIds.size > 0) {
				const now = new Date().toISOString()
				merged = {
					...merged,
					stammblatt: {
						...merged.stammblatt,
						welpen: merged.stammblatt.welpen.map((w) =>
							deletedWelpenIds.has(w.id) ? { ...w, deletedAt: now } : w,
						),
					},
				}
			}

			const newRecord = buildRecordFromForm(crypto.randomUUID(), merged)

			if (recordId && wurfabnahme) {
				await saveWurfabnahme(
					appendWurfabnahmeRecord(wurfabnahme, newRecord),
				)
			} else {
				const id = crypto.randomUUID()
				await saveWurfabnahme(createWurfabnahme(id, newRecord))
			}

			router.push('/wurfabnahmen')
		} finally {
			setIsSaving(false)
		}
	}, [
		formData,
		recordId,
		wurfabnahme,
		isReadOnly,
		isNewForm,
		syncDraftFromDom,
		deletedWelpenIds,
		router,
	])

	if (isLoading) {
		return <p>Lade Wurfabnahme…</p>
	}

	if (loadError) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-red-600">{loadError}</p>
				<button
					type="button"
					onClick={handleCancel}
					className="self-start rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
				>
					Zurück zur Liste
				</button>
			</div>
		)
	}

	return (
		<div className="wa-card">
			{showHistorySelect && wurfabnahme ? (
				<div className="wa-editor-header flex flex-wrap items-end gap-3">
					<div className="flex min-w-[240px] flex-1 flex-col gap-1">
						<label
							htmlFor="wurfabnahme-history"
							className="text-sm font-medium text-gray-700 dark:text-gray-200"
						>
							Historie
						</label>
						<select
							id="wurfabnahme-history"
							value={selectedHistoryValue}
							onChange={(event) => handleHistoryChange(event.target.value)}
							className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
						>
							<option value={CURRENT_DRAFT_VALUE}>
								Aktueller Entwurf
							</option>
							{getWurfabnahmeHistoryRecords(wurfabnahme).map((record) => (
								<option key={record.id} value={record.id}>
									{getWurfabnahmeRecordLabel(record)}
								</option>
							))}
						</select>
					</div>
					{isViewingHistory ? (
						<p className="text-sm text-amber-700 dark:text-amber-300">
							Archivstand — nur Ansicht.
						</p>
					) : null}
				</div>
			) : null}

			<WurfabnahmeApp
				key={`${selectedHistoryValue}-${isReadOnly ? 'ro' : 'ed'}`}
				basePath={basePath}
				formData={formData}
				onFormDataChange={handleFormDataChange}
				formRef={formRef}
				readOnly={isReadOnly}
				deletedWelpenIds={deletedWelpenIds}
				onMarkWelpeDelete={handleMarkWelpeDelete}
				onUndoWelpeDelete={handleUndoWelpeDelete}
			/>

			<div className="wa-editor-actions flex flex-wrap gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
				{!isReadOnly ? (
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving}
						className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
					>
						{isSaving ? 'Speichern…' : 'Speichern'}
					</button>
				) : null}
				<button
					type="button"
					onClick={handleCancel}
					disabled={isSaving}
					className="rounded bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
				>
					Abbrechen
				</button>
			</div>
		</div>
	)
}

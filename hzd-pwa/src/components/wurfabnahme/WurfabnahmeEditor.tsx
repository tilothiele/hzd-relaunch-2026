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

const LATEST_HISTORY_VALUE = 'latest'

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
	const [wurfabnahme, setWurfabnahme] = useState<Wurfabnahme | null>(null)
	const [selectedHistoryValue, setSelectedHistoryValue] = useState(
		LATEST_HISTORY_VALUE,
	)
	const [isEditing, setIsEditing] = useState(isNewForm)
	const [isLoading, setIsLoading] = useState(Boolean(recordId))
	const [isSaving, setIsSaving] = useState(false)
	const [loadError, setLoadError] = useState<string | null>(null)

	const isViewingHistory = selectedHistoryValue !== LATEST_HISTORY_VALUE
	const isReadOnly = isNewForm ? false : !isEditing || isViewingHistory
	const showHistorySelect = Boolean(
		wurfabnahme && wurfabnahme.records.length > 0,
	)
	const showBearbeitenButton = Boolean(
		recordId && wurfabnahme && !isEditing && !isViewingHistory,
	)

	const loadFormFromRecord = useCallback((recordFormData: WurfabnahmeFormData) => {
		setFormData(normalizeFormData(recordFormData))
	}, [])

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

			setWurfabnahme(loaded)
			loadFormFromRecord(getLatestWurfabnahmeRecord(loaded).formData)
			setSelectedHistoryValue(LATEST_HISTORY_VALUE)
			setIsEditing(false)
			setIsLoading(false)
		})

		return () => {
			cancelled = true
		}
	}, [recordId, loadFormFromRecord])

	const handleHistoryChange = useCallback(
		(value: string) => {
			if (!wurfabnahme || isEditing) return

			setSelectedHistoryValue(value)

			if (value === LATEST_HISTORY_VALUE) {
				loadFormFromRecord(getLatestWurfabnahmeRecord(wurfabnahme).formData)
				return
			}

			const historicalRecord = wurfabnahme.records.find(
				(record) => record.id === value,
			)
			if (historicalRecord) {
				loadFormFromRecord(historicalRecord.formData)
			}
		},
		[wurfabnahme, isEditing, loadFormFromRecord],
	)

	const handleStartEdit = useCallback(() => {
		if (!wurfabnahme) return

		const latest = getLatestWurfabnahmeRecord(wurfabnahme)
		setFormData(cloneFormDataForEdit(latest.formData))
		setSelectedHistoryValue(LATEST_HISTORY_VALUE)
		setIsEditing(true)
	}, [wurfabnahme])

	const handleCancel = useCallback(() => {
		router.push('/wurfabnahmen')
	}, [router])

	const handleSave = useCallback(async () => {
		if (!formRef.current || isReadOnly) return

		setIsSaving(true)

		try {
			const merged = mergeFormDataFromDom(formData, formRef.current)
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
	}, [formData, recordId, wurfabnahme, isReadOnly, router])

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

	const latestRecordId = wurfabnahme
		? getLatestWurfabnahmeRecord(wurfabnahme).id
		: null

	return (
		<div className="flex flex-col gap-4">
			{(showHistorySelect || showBearbeitenButton) && wurfabnahme ? (
				<div className="wa-editor-header flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					{showHistorySelect ? (
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
								disabled={isEditing}
								className="rounded border border-gray-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900"
							>
								<option value={LATEST_HISTORY_VALUE}>
									{getWurfabnahmeRecordLabel(
										getLatestWurfabnahmeRecord(wurfabnahme),
										{ isLatest: true },
									)}
								</option>
								{getWurfabnahmeHistoryRecords(wurfabnahme)
									.filter((record) => record.id !== latestRecordId)
									.map((record) => (
										<option key={record.id} value={record.id}>
											{getWurfabnahmeRecordLabel(record)}
										</option>
									))}
							</select>
						</div>
					) : null}

					{showBearbeitenButton ? (
						<button
							type="button"
							onClick={handleStartEdit}
							className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
						>
							Bearbeiten
						</button>
					) : null}

					{isReadOnly && !isNewForm ? (
						<p className="text-sm text-amber-700 dark:text-amber-300">
							{isViewingHistory
								? 'Archivstand — nur Ansicht.'
								: 'Aktueller Stand — nur Ansicht. Zum Bearbeiten „Bearbeiten“ wählen.'}
						</p>
					) : null}
				</div>
			) : null}

			<WurfabnahmeApp
				key={isEditing ? 'edit' : `view-${selectedHistoryValue}`}
				basePath={basePath}
				formData={formData}
				onFormDataChange={setFormData}
				formRef={formRef}
				readOnly={isReadOnly}
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

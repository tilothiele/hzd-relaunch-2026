'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import WurfabnahmeApp from '@/components/wurfabnahme/WurfabnahmeApp'
import { mergeFormDataFromDom } from '@/lib/wurfabnahme-form-serialize'
import { getWurfabnahme, saveWurfabnahme } from '@/services/wurfabnahme-db'
import {
	buildRecordFromForm,
	createEmptyFormData,
	normalizeFormData,
	type WurfabnahmeFormData,
	type WurfabnahmeRecord,
} from '@/types/wurfabnahme-form'

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
	const [formData, setFormData] = useState<WurfabnahmeFormData>(
		createEmptyFormData,
	)
	const [existingRecord, setExistingRecord] = useState<
		Pick<WurfabnahmeRecord, 'createdAt'> | null
	>(null)
	const [isLoading, setIsLoading] = useState(Boolean(recordId))
	const [isSaving, setIsSaving] = useState(false)
	const [loadError, setLoadError] = useState<string | null>(null)

	useEffect(() => {
		if (!recordId) {
			setIsLoading(false)
			return
		}

		let cancelled = false

		getWurfabnahme(recordId).then((record) => {
			if (cancelled) return

			if (!record) {
				setLoadError('Wurfabnahme nicht gefunden.')
				setIsLoading(false)
				return
			}

			setFormData(normalizeFormData(record.formData))
			setExistingRecord({ createdAt: record.createdAt })
			setIsLoading(false)
		})

		return () => {
			cancelled = true
		}
	}, [recordId])

	const handleCancel = useCallback(() => {
		router.push('/wurfabnahmen')
	}, [router])

	const handleSave = useCallback(async () => {
		if (!formRef.current) return

		setIsSaving(true)

		try {
			const merged = mergeFormDataFromDom(formData, formRef.current)
			const id = recordId ?? crypto.randomUUID()
			const record = buildRecordFromForm(id, merged, existingRecord ?? undefined)

			await saveWurfabnahme(record)
			router.push('/wurfabnahmen')
		} finally {
			setIsSaving(false)
		}
	}, [formData, recordId, existingRecord, router])

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
		<div className="flex flex-col gap-4">
			<WurfabnahmeApp
				basePath={basePath}
				formData={formData}
				onFormDataChange={setFormData}
				formRef={formRef}
			/>

			<div className="wa-editor-actions flex flex-wrap gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
				<button
					type="button"
					onClick={handleSave}
					disabled={isSaving}
					className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
				>
					{isSaving ? 'Speichern…' : 'Speichern'}
				</button>
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

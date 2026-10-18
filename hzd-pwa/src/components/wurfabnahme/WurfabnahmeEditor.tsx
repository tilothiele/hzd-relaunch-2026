'use client'

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import WurfabnahmeApp from '@/components/wurfabnahme/WurfabnahmeApp'
import {
	clearWurfabnahmeDraft,
	getWurfabnahme,
	getWurfabnahmeDraft,
	saveWurfabnahme,
	saveWurfabnahmeDraft,
} from '@/services/wurfabnahme-db'
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
const AUTOSAVE_INTERVAL_MS = 10_000

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
	const [activeTab, setActiveTab] = useState<string>('stammblatt')
	const [autosaveReady, setAutosaveReady] = useState(false)
	const skipAutosaveRef = useRef(false)
	const autosaveReadyRef = useRef(false)
	const autosaveGenerationRef = useRef(0)
	const snapshotRef = useRef({
		recordId: recordId ?? null,
		formData: draftFormData,
		deletedWelpenIds: [] as string[],
		activeTab,
	})

	snapshotRef.current = {
		recordId: recordId ?? null,
		formData: draftFormData,
		deletedWelpenIds: [...deletedWelpenIds],
		activeTab,
	}

	const isViewingHistory = selectedHistoryValue !== CURRENT_DRAFT_VALUE
	const isReadOnly = !isNewForm && isViewingHistory
	const showHistorySelect = Boolean(
		wurfabnahme && wurfabnahme.records.length > 0,
	)

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
		let cancelled = false

		async function loadEditor() {
			const storedDraft = await getWurfabnahmeDraft()
			if (cancelled) return

			const currentId = recordId ?? null
			const matchesDraft = storedDraft?.recordId === currentId

			if (!recordId) {
				if (matchesDraft && storedDraft) {
					const restored = normalizeFormData(storedDraft.formData)
					setDraftFormData(restored)
					setFormData(restored)
					setDeletedWelpenIds(new Set(storedDraft.deletedWelpenIds))
					if (storedDraft.activeTab) {
						setActiveTab(storedDraft.activeTab)
					}
				}
				setIsLoading(false)
				autosaveReadyRef.current = true
				setAutosaveReady(true)
				return
			}

			const loaded = await getWurfabnahme(recordId)
			if (cancelled) return

			if (!loaded || loaded.records.length === 0) {
				setLoadError('Wurfabnahme nicht gefunden.')
				setIsLoading(false)
				return
			}

			const base = cloneFormDataForEdit(
				getLatestWurfabnahmeRecord(loaded).formData,
			)
			const restored = matchesDraft && storedDraft
				? normalizeFormData(storedDraft.formData)
				: base

			setWurfabnahme(loaded)
			setDraftFormData(restored)
			setFormData(restored)
			setSelectedHistoryValue(CURRENT_DRAFT_VALUE)
			if (matchesDraft && storedDraft) {
				setDeletedWelpenIds(new Set(storedDraft.deletedWelpenIds))
				if (storedDraft.activeTab) {
					setActiveTab(storedDraft.activeTab)
				}
			}
			setIsLoading(false)
			autosaveReadyRef.current = true
			setAutosaveReady(true)
		}

		void loadEditor()

		return () => {
			cancelled = true
			autosaveReadyRef.current = false
		}
	}, [recordId])

	const handleHistoryChange = useCallback(
		(value: string) => {
			if (!wurfabnahme) return

			if (value === CURRENT_DRAFT_VALUE) {
				const draft = isViewingHistory
					? draftFormData
					: formData
				setDraftFormData(draft)
				setFormData(draft)
				setSelectedHistoryValue(CURRENT_DRAFT_VALUE)
				return
			}

			if (!isViewingHistory) {
				setDraftFormData(formData)
			}

			const historicalRecord = wurfabnahme.records.find(
				(record) => record.id === value,
			)
			if (historicalRecord) {
				setFormData(normalizeFormData(historicalRecord.formData))
				setSelectedHistoryValue(value)
			}
		},
		[wurfabnahme, isViewingHistory, draftFormData, formData],
	)

	const discardTemporaryDraft = useCallback(async () => {
		skipAutosaveRef.current = true
		autosaveGenerationRef.current += 1
		const existing = await getWurfabnahmeDraft()
		const currentId = recordId ?? null
		if (!existing || existing.recordId === currentId) {
			await clearWurfabnahmeDraft()
		}
	}, [recordId])

	const handleCancel = useCallback(() => {
		void discardTemporaryDraft().finally(() => {
			router.push('/wurfabnahmen')
		})
	}, [discardTemporaryDraft, router])

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
		if (isReadOnly) return

		setIsSaving(true)

		try {
			let merged = formData

			if (deletedWelpenIds.size > 0) {
				const now = new Date().toISOString()
			merged = {
				...merged,
				welpen: merged.welpen.map((w) =>
					deletedWelpenIds.has(w.id) ? { ...w, deletedAt: now } : w,
				),
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

			await discardTemporaryDraft()
			router.push('/wurfabnahmen')
		} finally {
			setIsSaving(false)
		}
	}, [
		formData,
		recordId,
		wurfabnahme,
		isReadOnly,
		deletedWelpenIds,
		router,
		discardTemporaryDraft,
	])

	const persistDraft = useCallback(async () => {
		if (skipAutosaveRef.current || !autosaveReadyRef.current) return

		const generation = autosaveGenerationRef.current
		const snapshot = snapshotRef.current
		const existing = await getWurfabnahmeDraft()
		if (
			skipAutosaveRef.current
			|| generation !== autosaveGenerationRef.current
		) {
			return
		}
		if (existing && existing.recordId !== snapshot.recordId) return

		await saveWurfabnahmeDraft({
			recordId: snapshot.recordId,
			formData: snapshot.formData,
			deletedWelpenIds: snapshot.deletedWelpenIds,
			activeTab: snapshot.activeTab,
		})

		if (
			skipAutosaveRef.current
			|| generation !== autosaveGenerationRef.current
		) {
			await clearWurfabnahmeDraft()
		}
	}, [])

	useEffect(() => {
		if (!autosaveReady) return

		const timer = window.setInterval(() => {
			void persistDraft()
		}, AUTOSAVE_INTERVAL_MS)

		const handlePageHide = () => {
			void persistDraft()
		}

		window.addEventListener('pagehide', handlePageHide)

		return () => {
			window.clearInterval(timer)
			window.removeEventListener('pagehide', handlePageHide)
			void persistDraft()
		}
	}, [autosaveReady, persistDraft])

	const wurfTabs = [
		{ id: 'stammblatt', label: 'Stammblatt' },
		...formData.welpen
			.filter((welpe) => !welpe.deletedAt)
			.map((welpe, index) => ({
				id: `welpe-${welpe.id}`,
				label: `Welpe ${index + 1}`,
			})),
	]

	const handleTabKeyDown = (
		event: KeyboardEvent<HTMLButtonElement>,
		index: number,
	) => {
		const direction = event.key === 'ArrowRight'
			? 1
			: event.key === 'ArrowLeft'
				? -1
				: 0
		if (direction === 0) {
			return
		}

		event.preventDefault()
		const nextIndex = (index + direction + wurfTabs.length) % wurfTabs.length
		setActiveTab(wurfTabs[nextIndex].id)
		const tabs = event.currentTarget.parentElement
			?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
		tabs?.[nextIndex]?.focus()
	}

	useEffect(() => {
		if (activeTab === 'stammblatt') {
			return
		}

		const welpeId = activeTab.startsWith('welpe-')
			? activeTab.slice('welpe-'.length)
			: ''
		const stillThere = formData.welpen.some(
			(welpe) => welpe.id === welpeId && !welpe.deletedAt,
		)
		if (!stillThere) {
			setActiveTab('stammblatt')
		}
	}, [activeTab, formData.welpen])

	if (isLoading) {
		return <p>Lade Wurfabnahme…</p>
	}

	if (loadError) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-red-600">{loadError}</p>
				<button
					type="button"
					onClick={() => router.push('/wurfabnahmen')}
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

			<div className="-mx-4 overflow-x-auto sm:-mx-8">
				<nav
					className="flex w-max min-w-full justify-center"
					role="tablist"
					aria-label="Wurfabnahme"
				>
					{wurfTabs.map((tab, index) => {
						const isSelected = activeTab === tab.id

						return (
							<button
								key={tab.id}
								type="button"
								role="tab"
								id={`wurf-tab-${tab.id}`}
								aria-selected={isSelected}
								aria-controls="wurfabnahme-panel"
								tabIndex={isSelected ? 0 : -1}
								onClick={() => setActiveTab(tab.id)}
								onKeyDown={(event) =>
									handleTabKeyDown(event, index)
								}
								className={`inline-flex items-center whitespace-nowrap border-x border-t border-gray-300 px-4 py-3 text-sm leading-5 dark:border-gray-600 ${
									index > 0 ? '-ml-px' : ''
								} ${
									isSelected
										? 'bg-[#e8eef8] font-semibold text-[var(--color-kapitaensblau)] dark:bg-gray-700 dark:text-white'
										: 'bg-white font-medium text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
								}`}
							>
								{tab.label}
							</button>
						)
					})}
				</nav>
			</div>

			<div
				id="wurfabnahme-panel"
				role="tabpanel"
				aria-labelledby={`wurf-tab-${activeTab}`}
			>
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
				activeTab={activeTab}
				onTabChange={setActiveTab}
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
		</div>
	)
}

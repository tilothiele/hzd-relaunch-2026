'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DogSearchModal } from '@/components/koerung/DogSearchModal'
import { TeilnehmerTab } from '@/components/koerung/TeilnehmerTab'
import { BewertungenTab } from '@/components/koerung/BewertungenTab'
import { mapDogToKoerungHundFields } from '@/lib/dog-to-koerung-hund'
import type { Dog } from '@/services/db'
import {
	getKoerungVeranstaltung,
	saveKoerungVeranstaltung,
} from '@/services/koerung-veranstaltung-db'
import {
	createEmptyKoerungVeranstaltung,
	createKoerungHund,
	normalizeKoerungVeranstaltung,
	renumberKoerungHunde,
	type KoerungHund,
	type KoerungVeranstaltung,
} from '@/types/koerung-veranstaltung'

interface KoerungVeranstaltungEditorProps {
	veranstaltungId?: string
}

const inputClassName =
	'w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export function KoerungVeranstaltungEditor({
	veranstaltungId,
}: KoerungVeranstaltungEditorProps) {
	const router = useRouter()
	const isNew = !veranstaltungId
	const [recordId] = useState(() => veranstaltungId ?? crypto.randomUUID())
	const [veranstaltung, setVeranstaltung] = useState<KoerungVeranstaltung>(
		() => createEmptyKoerungVeranstaltung(recordId),
	)
	const [isLoading, setIsLoading] = useState(!isNew)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [searchHundId, setSearchHundId] = useState<string | null>(null)
	const [dragHundId, setDragHundId] = useState<string | null>(null)
	const [dragOverHundId, setDragOverHundId] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<'teilnehmer' | 'bewertungen'>(
		'teilnehmer',
	)

	useEffect(() => {
		if (!veranstaltungId) {
			return
		}

		getKoerungVeranstaltung(veranstaltungId).then((loaded) => {
			if (!loaded) {
				setLoadError('Veranstaltung nicht gefunden.')
			} else {
				setVeranstaltung(normalizeKoerungVeranstaltung(loaded))
			}
			setIsLoading(false)
		})
	}, [veranstaltungId])

	const updateField = <K extends keyof KoerungVeranstaltung>(
		field: K,
		value: KoerungVeranstaltung[K],
	) => {
		setVeranstaltung((current) => ({
			...current,
			[field]: value,
		}))
	}

	const updateHund = (
		hundId: string,
		field: keyof KoerungHund,
		value: KoerungHund[keyof KoerungHund],
	) => {
		setVeranstaltung((current) => ({
			...current,
			hunde: current.hunde.map((hund) =>
				hund.id === hundId ? { ...hund, [field]: value } : hund,
			),
		}))
	}

	const handleAddHund = () => {
		setVeranstaltung((current) => ({
			...current,
			hunde: renumberKoerungHunde([
				...current.hunde,
				createKoerungHund(),
			]),
		}))
	}

	const handleRemoveHund = (hundId: string) => {
		setVeranstaltung((current) => ({
			...current,
			hunde: renumberKoerungHunde(
				current.hunde.filter((hund) => hund.id !== hundId),
			),
		}))
	}

	const handleApplyDog = (dog: Dog) => {
		if (!searchHundId) {
			return
		}

		const fields = mapDogToKoerungHundFields(dog)
		setVeranstaltung((current) => ({
			...current,
			hunde: current.hunde.map((hund) =>
				hund.id === searchHundId ? { ...hund, ...fields } : hund,
			),
		}))
		setSearchHundId(null)
	}

	const handleDragStart = (hundId: string) => {
		setDragHundId(hundId)
	}

	const handleDragOver = (
		event: React.DragEvent<HTMLTableRowElement>,
		hundId: string,
	) => {
		event.preventDefault()
		if (dragHundId === hundId) {
			return
		}
		setDragOverHundId(hundId)
	}

	const handleDrop = (targetHundId: string) => {
		if (!dragHundId || dragHundId === targetHundId) {
			return
		}

		setVeranstaltung((current) => {
			const hunde = [...current.hunde]
			const fromIndex = hunde.findIndex((h) => h.id === dragHundId)
			const toIndex = hunde.findIndex((h) => h.id === targetHundId)

			if (fromIndex === -1 || toIndex === -1) {
				return current
			}

			const [moved] = hunde.splice(fromIndex, 1)
			hunde.splice(toIndex, 0, moved)

			return {
				...current,
				hunde: renumberKoerungHunde(hunde),
			}
		})
	}

	const handleDragEnd = () => {
		setDragHundId(null)
		setDragOverHundId(null)
	}

	const handleSave = async () => {
		setIsSaving(true)
		const now = new Date().toISOString()
		const normalized = normalizeKoerungVeranstaltung(veranstaltung)

		await saveKoerungVeranstaltung({
			...normalized,
			updatedAt: now,
			createdAt: isNew ? now : normalized.createdAt,
		})

		setIsSaving(false)
		router.push('/koerungen')
	}

	if (isLoading) {
		return <p>Lade Veranstaltung…</p>
	}

	if (loadError) {
		return <p className="text-red-600">{loadError}</p>
	}

	return (
		<div className="flex flex-col gap-6">
			<DogSearchModal
				isOpen={searchHundId !== null}
				onClose={() => setSearchHundId(null)}
				onSelect={handleApplyDog}
			/>

			<div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
				<h2 className="mb-4 text-lg font-semibold">Veranstaltung</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="flex flex-col gap-1">
						<label htmlFor="koerung-datum" className="text-sm font-medium">
							Datum
						</label>
						<input
							id="koerung-datum"
							type="date"
							value={veranstaltung.datum}
							onChange={(e) => updateField('datum', e.target.value)}
							className={inputClassName}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="koerung-name" className="text-sm font-medium">
							Name
						</label>
						<input
							id="koerung-name"
							type="text"
							value={veranstaltung.name}
							onChange={(e) => updateField('name', e.target.value)}
							className={inputClassName}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="koerung-ort" className="text-sm font-medium">
							Ort
						</label>
						<input
							id="koerung-ort"
							type="text"
							value={veranstaltung.ort}
							onChange={(e) => updateField('ort', e.target.value)}
							className={inputClassName}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label
							htmlFor="koerung-sonderleiter"
							className="text-sm font-medium"
						>
							Sonderleiter
						</label>
						<input
							id="koerung-sonderleiter"
							type="text"
							value={veranstaltung.sonderleiterName}
							onChange={(e) =>
								updateField('sonderleiterName', e.target.value)
							}
							className={inputClassName}
						/>
					</div>
				</div>
			</div>

			<div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
				<div className="border-b border-gray-200 dark:border-gray-700">
					<nav className="flex gap-0 px-4" aria-label="Tabs">
						<button
							type="button"
							onClick={() => setActiveTab('teilnehmer')}
							className={`relative px-4 py-3 text-sm font-medium transition-colors ${
								activeTab === 'teilnehmer'
									? 'text-indigo-600 dark:text-indigo-400'
									: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
							}`}
						>
							Teilnehmer
							{activeTab === 'teilnehmer' && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
							)}
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('bewertungen')}
							className={`relative px-4 py-3 text-sm font-medium transition-colors ${
								activeTab === 'bewertungen'
									? 'text-indigo-600 dark:text-indigo-400'
									: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
							}`}
						>
							Bewertungen
							{activeTab === 'bewertungen' && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
							)}
						</button>
					</nav>
				</div>

				<div className="p-4">
					{activeTab === 'teilnehmer' ? (
						<TeilnehmerTab
							hunde={veranstaltung.hunde}
							inputClassName={inputClassName}
							dragHundId={dragHundId}
							dragOverHundId={dragOverHundId}
							onAddHund={handleAddHund}
							onRemoveHund={handleRemoveHund}
							onUpdateHund={updateHund}
							onDragStart={handleDragStart}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							onDragEnd={handleDragEnd}
							onOpenSearch={setSearchHundId}
						/>
					) : (
						<BewertungenTab />
					)}
				</div>
			</div>

			<div className="flex flex-wrap gap-3">
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
					onClick={() => router.push('/koerungen')}
					className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
				>
					Abbrechen
				</button>
			</div>
		</div>
	)
}
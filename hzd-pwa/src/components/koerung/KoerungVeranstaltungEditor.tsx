'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DogSearchModal } from '@/components/koerung/DogSearchModal'
import { mapDogToKoerungHundFields } from '@/lib/dog-to-koerung-hund'
import type { Dog } from '@/services/db'
import {
	getKoerungVeranstaltung,
	saveKoerungVeranstaltung,
} from '@/services/koerung-veranstaltung-db'
import {
	createEmptyKoerungVeranstaltung,
	createKoerungHund,
	KOERUNG_FARBE_OPTIONS,
	KOERUNG_GESCHLECHT_OPTIONS,
	normalizeKoerungVeranstaltung,
	renumberKoerungHunde,
	type KoerungFarbe,
	type KoerungGeschlecht,
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
				hund.id === searchHundId
					? { ...hund, ...fields }
					: hund,
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

			<div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h2 className="text-lg font-semibold">Hunde</h2>
					<button
						type="button"
						onClick={handleAddHund}
						className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
					>
						Hund hinzufügen
					</button>
				</div>

				{veranstaltung.hunde.length === 0 ? (
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Noch keine Hunde erfasst.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="bg-gray-50 font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
								<tr>
									<th className="px-2 py-2" colSpan={2}>Nr.</th>
									<th className="px-2 py-2">Voller Zwingername</th>
									<th className="px-2 py-2">Zuchtbuch-Nr.</th>
									<th className="px-2 py-2">Geschlecht</th>
									<th className="px-2 py-2">Wurftag</th>
									<th className="px-2 py-2">Farbe</th>
									<th className="px-2 py-2">Besitzer</th>
									<th className="px-2 py-2">Mitgliedsnummer</th>
									<th className="px-2 py-2" />
									<th className="px-2 py-2" />
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
								{veranstaltung.hunde.map((hund) => (
									<tr
										key={hund.id}
										draggable
										onDragStart={() => handleDragStart(hund.id)}
										onDragOver={(event) =>
											handleDragOver(event, hund.id)
										}
										onDrop={() => handleDrop(hund.id)}
										onDragEnd={handleDragEnd}
										className={`${
											dragHundId === hund.id
												? 'opacity-40'
												: dragOverHundId === hund.id
													? 'bg-indigo-50 dark:bg-indigo-900/30'
													: ''
										} cursor-grab active:cursor-grabbing`}
									>
										<td className="px-2 py-2">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												strokeWidth="1.5"
												stroke="currentColor"
												className="h-4 w-4 text-gray-400"
												aria-hidden="true"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													d="M3.75 9h16.5m-16.5 6.75h16.5"
												/>
											</svg>
										</td>
										<td className="px-2 py-2 font-medium">
											{hund.startnummer}
										</td>
										<td className="px-2 py-2">
											<input
												type="text"
												value={hund.vollerZwingername}
												onChange={(e) =>
													updateHund(
														hund.id,
														'vollerZwingername',
														e.target.value,
													)
												}
												className={inputClassName}
											/>
										</td>
										<td className="px-2 py-2">
											<input
												type="text"
												value={hund.zuchtbuchnummer}
												onChange={(e) =>
													updateHund(
														hund.id,
														'zuchtbuchnummer',
														e.target.value,
													)
												}
												className={inputClassName}
											/>
										</td>
										<td className="px-2 py-2">
											<select
												value={hund.geschlecht}
												onChange={(e) =>
													updateHund(
														hund.id,
														'geschlecht',
														e.target.value as KoerungGeschlecht,
													)
												}
												className={inputClassName}
											>
												<option value="">–</option>
												{KOERUNG_GESCHLECHT_OPTIONS.map((option) => (
													<option key={option} value={option}>
														{option}
													</option>
												))}
											</select>
										</td>
										<td className="px-2 py-2">
											<input
												type="date"
												value={hund.wurftag}
												onChange={(e) =>
													updateHund(
														hund.id,
														'wurftag',
														e.target.value,
													)
												}
												className={inputClassName}
											/>
										</td>
										<td className="px-2 py-2">
											<select
												value={hund.farbe}
												onChange={(e) =>
													updateHund(
														hund.id,
														'farbe',
														e.target.value as KoerungFarbe,
													)
												}
												className={inputClassName}
											>
												<option value="">–</option>
												{KOERUNG_FARBE_OPTIONS.map((option) => (
													<option key={option} value={option}>
														{option}
													</option>
												))}
											</select>
										</td>
										<td className="px-2 py-2">
											<input
												type="text"
												value={hund.besitzer}
												onChange={(e) =>
													updateHund(
														hund.id,
														'besitzer',
														e.target.value,
													)
												}
												className={inputClassName}
											/>
										</td>
										<td className="px-2 py-2">
											<input
												type="text"
												value={hund.mitgliedsnummer}
												onChange={(e) =>
													updateHund(
														hund.id,
														'mitgliedsnummer',
														e.target.value,
													)
												}
												className={inputClassName}
											/>
										</td>
										<td className="px-2 py-2">
											<button
												type="button"
												onClick={() => setSearchHundId(hund.id)}
												className="inline-flex rounded p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-gray-700"
												title="Hund aus Datenbank übernehmen"
												aria-label="Hund aus Datenbank übernehmen"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													strokeWidth="1.5"
													stroke="currentColor"
													className="h-5 w-5"
													aria-hidden="true"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
													/>
												</svg>
											</button>
										</td>
										<td className="px-2 py-2">
											<button
												type="button"
												onClick={() => handleRemoveHund(hund.id)}
												className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
											>
												Löschen
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
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

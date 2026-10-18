'use client'

import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { clearWurfabnahmeDraft } from '@/services/wurfabnahme-db'
import { getWurfabnahmeListLabel } from '@/types/wurfabnahme-form'

function formatDateTime(iso: string): string {
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return iso
	return date.toLocaleString('de-DE')
}

export function WurfabnahmenList() {
	const router = useRouter()
	const records = useLiveQuery(() =>
		db.wurfabnahmen.orderBy('updatedAt').reverse().toArray(),
	)
	const draft = useLiveQuery(async () => {
		const stored = await db.wurfabnahmeDraft.get('current')
		return stored ?? null
	})

	const handleContinueDraft = () => {
		if (!draft) return
		const href = draft.recordId
			? `/wurfabnahmen/${draft.recordId}`
			: '/wurfabnahmen/neu'
		router.push(href)
	}

	const handleDiscardDraft = () => {
		void clearWurfabnahmeDraft()
	}

	return (
		<div className="flex flex-col gap-4">
			{draft ? (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					role="presentation"
				>
					<div
						className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
						role="dialog"
						aria-modal="true"
						aria-labelledby="wurfabnahme-draft-title"
					>
						<h2
							id="wurfabnahme-draft-title"
							className="text-lg font-semibold"
						>
							Ein nicht gespeichertes Wurfabnahmeprotokoll existiert.
						</h2>
						<p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
							Weiter bearbeiten? Verwerfen?
						</p>
						<div className="mt-6 flex flex-wrap justify-end gap-3">
							<button
								type="button"
								onClick={handleDiscardDraft}
								className="rounded bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
							>
								Verwerfen
							</button>
							<button
								type="button"
								onClick={handleContinueDraft}
								autoFocus
								className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
							>
								Weiter bearbeiten
							</button>
						</div>
					</div>
				</div>
			) : null}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Wurfabnahmen</h1>
					<p>Lokal gespeicherte Wurfabnahmeprotokolle auf diesem Gerät.</p>
				</div>
				<button
					type="button"
					onClick={() => router.push('/wurfabnahmen/neu')}
					className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>
					Neu
				</button>
			</div>

			{records === undefined ? (
				<p>Lade Wurfabnahmen…</p>
			) : records.length === 0 ? (
				<p>Noch keine Wurfabnahmen gespeichert.</p>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full overflow-hidden rounded-lg bg-white text-left text-sm shadow-sm dark:bg-gray-800">
						<thead className="bg-gray-50 font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
							<tr>
								<th className="px-4 py-3">Bezeichnung</th>
								<th className="px-4 py-3">Welpen</th>
								<th className="px-4 py-3">Zuletzt geändert</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
							{records.map((wurfabnahme) => (
								<tr
									key={wurfabnahme.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-700"
								>
									<td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
										{getWurfabnahmeListLabel(wurfabnahme)}
									</td>
									<td className="px-4 py-3">{wurfabnahme.welpenCount}</td>
									<td className="px-4 py-3">
										{formatDateTime(wurfabnahme.updatedAt)}
										{wurfabnahme.records.length > 1 ? (
											<span className="ml-2 text-xs text-gray-500">
												({wurfabnahme.records.length} Stände)
											</span>
										) : null}
									</td>
									<td className="px-4 py-3 text-right">
										<button
											type="button"
											onClick={() => router.push(`/wurfabnahmen/${wurfabnahme.id}`)}
											className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
										>
											Öffnen
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

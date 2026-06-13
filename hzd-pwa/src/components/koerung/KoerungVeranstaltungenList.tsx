'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { deleteKoerungVeranstaltung } from '@/services/koerung-veranstaltung-db'
import { formatKoerungDatum } from '@/types/koerung-veranstaltung'

function formatDateTime(iso: string): string {
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return iso
	return date.toLocaleString('de-DE')
}

export function KoerungVeranstaltungenList() {
	const router = useRouter()
	const records = useLiveQuery(() =>
		db.koerungVeranstaltungen.orderBy('updatedAt').reverse().toArray(),
	)

	const handleDelete = async (id: string, name: string) => {
		const label = name.trim() || 'diese Veranstaltung'
		if (!window.confirm(`„${label}" wirklich löschen?`)) {
			return
		}

		await deleteKoerungVeranstaltung(id)
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Link
					href="/meine-koerboegen/neu"
					className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				>
					Neu
				</Link>
			</div>

			{records === undefined ? (
				<p>Lade Veranstaltungen…</p>
			) : records.length === 0 ? (
				<p>Noch keine Veranstaltungen gespeichert.</p>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full overflow-hidden rounded-lg bg-white text-left text-sm shadow-sm dark:bg-gray-800">
						<thead className="bg-gray-50 font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
							<tr>
								<th className="px-4 py-3">Datum</th>
								<th className="px-4 py-3">Name</th>
								<th className="px-4 py-3">Ort</th>
								<th className="px-4 py-3">Sonderleiter</th>
								<th className="px-4 py-3">Hunde</th>
								<th className="px-4 py-3">Zuletzt geändert</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
							{records.map((veranstaltung) => (
								<tr
									key={veranstaltung.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-700"
								>
									<td className="px-4 py-3">
										{formatKoerungDatum(veranstaltung.datum)}
									</td>
									<td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
										{veranstaltung.name.trim() || '–'}
									</td>
									<td className="px-4 py-3">
										{veranstaltung.ort.trim() || '–'}
									</td>
									<td className="px-4 py-3">
										{veranstaltung.sonderleiterName.trim() || '–'}
									</td>
									<td className="px-4 py-3">
										{veranstaltung.hunde.length}
									</td>
									<td className="px-4 py-3">
										{formatDateTime(veranstaltung.updatedAt)}
									</td>
									<td className="px-4 py-3">
										<div className="flex justify-end gap-2">
											<button
												type="button"
												onClick={() =>
													router.push(
														`/meine-koerboegen/${veranstaltung.id}`,
													)
												}
												className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
											>
												Bearbeiten
											</button>
											<button
												type="button"
												onClick={() =>
													handleDelete(
														veranstaltung.id,
														veranstaltung.name,
													)
												}
												className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
											>
												Löschen
											</button>
										</div>
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

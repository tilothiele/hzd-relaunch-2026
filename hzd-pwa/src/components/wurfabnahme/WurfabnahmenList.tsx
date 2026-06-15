'use client'

import { useRouter } from 'next/navigation'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
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

	return (
		<div className="flex flex-col gap-4">
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

import type {
	KoerungFarbe,
	KoerungGeschlecht,
	KoerungHund,
} from '@/types/koerung-veranstaltung'

interface TeilnehmerTabProps {
	hunde: KoerungHund[]
	inputClassName: string
	dragHundId: string | null
	dragOverHundId: string | null
	onAddHund: () => void
	onRemoveHund: (hundId: string) => void
	onUpdateHund: (
		hundId: string,
		field: keyof KoerungHund,
		value: KoerungHund[keyof KoerungHund],
	) => void
	onDragStart: (hundId: string) => void
	onDragOver: (event: React.DragEvent<HTMLTableRowElement>, hundId: string) => void
	onDrop: (targetHundId: string) => void
	onDragEnd: () => void
	onOpenSearch: (hundId: string) => void
}

export function TeilnehmerTab({
	hunde,
	inputClassName,
	dragHundId,
	dragOverHundId,
	onAddHund,
	onRemoveHund,
	onUpdateHund,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onOpenSearch,
}: TeilnehmerTabProps) {
	return (
		<>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-lg font-semibold">Teilnehmer</h2>
				<button
					type="button"
					onClick={onAddHund}
					className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
				>
					Hund hinzufügen
				</button>
			</div>

			{hunde.length === 0 ? (
				<p className="text-sm text-gray-500 dark:text-gray-400">
					Noch keine Hunde erfasst.
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="min-w-full text-left text-sm">
						<thead className="bg-gray-50 font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
							<tr>
								<th className="px-2 py-2" colSpan={2}>
									Nr.
								</th>
								<th className="px-2 py-2">Zwingername</th>
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
							{hunde.map((hund) => (
								<tr
									key={hund.id}
									draggable
									onDragStart={() => onDragStart(hund.id)}
									onDragOver={(event) => onDragOver(event, hund.id)}
									onDrop={() => onDrop(hund.id)}
									onDragEnd={onDragEnd}
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
												onUpdateHund(
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
												onUpdateHund(
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
												onUpdateHund(
													hund.id,
													'geschlecht',
													e.target.value as KoerungGeschlecht,
												)
											}
											className={inputClassName}
										>
											<option value="">–</option>
											{['R', 'H'].map((option) => (
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
												onUpdateHund(hund.id, 'wurftag', e.target.value)
											}
											className={inputClassName}
										/>
									</td>
									<td className="px-2 py-2">
										<select
											value={hund.farbe}
											onChange={(e) =>
												onUpdateHund(
													hund.id,
													'farbe',
													e.target.value as KoerungFarbe,
												)
											}
											className={inputClassName}
										>
											<option value="">–</option>
											{['S', 'SM', 'B'].map((option) => (
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
												onUpdateHund(hund.id, 'besitzer', e.target.value)
											}
											className={inputClassName}
										/>
									</td>
									<td className="px-2 py-2">
										<input
											type="text"
											value={hund.mitgliedsnummer}
											onChange={(e) =>
												onUpdateHund(
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
											onClick={() => onOpenSearch(hund.id)}
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
											onClick={() => onRemoveHund(hund.id)}
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
		</>
	)
}
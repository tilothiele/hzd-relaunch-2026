'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Dog } from '@/services/db'
import { DOG_SEARCH_MAX_RESULTS, searchDogs } from '@/lib/dog-search'

interface DogSearchModalProps {
	isOpen: boolean
	onClose: () => void
	onSelect: (dog: Dog) => void
}

const inputClassName =
	'w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'

export function DogSearchModal({
	isOpen,
	onClose,
	onSelect,
}: DogSearchModalProps) {
	const [query, setQuery] = useState('')
	const dogs = useLiveQuery(() => db.dogs.toArray(), [])

	const results = useMemo(() => {
		if (!dogs) {
			return []
		}

		return searchDogs(dogs, query, DOG_SEARCH_MAX_RESULTS)
	}, [dogs, query])

	useEffect(() => {
		if (!isOpen) {
			setQuery('')
		}
	}, [isOpen])

	useEffect(() => {
		if (!isOpen) {
			return
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, onClose])

	if (!isOpen) {
		return null
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={onClose}
			role="presentation"
		>
			<div
				className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800"
				role="dialog"
				aria-modal="true"
				aria-labelledby="dog-search-modal-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<h3
						id="dog-search-modal-title"
						className="text-lg font-semibold"
					>
						Hund aus Datenbank übernehmen
					</h3>
				</div>

				<div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
					<label htmlFor="dog-search-query" className="sr-only">
						Hund suchen
					</label>
					<input
						id="dog-search-query"
						type="text"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Name, Chip-Nr., Zuchtbuch-Nr. …"
						className={inputClassName}
						autoFocus
					/>
				</div>

				<div className="overflow-y-auto px-4 py-3">
					{dogs === undefined ? (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Lade Hunde…
						</p>
					) : dogs.length === 0 ? (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Keine synchronisierten Hunde vorhanden.
						</p>
					) : !query.trim() ? (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Suchbegriff eingeben, um Vorschläge anzuzeigen.
						</p>
					) : results.length === 0 ? (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Keine Hunde gefunden.
						</p>
					) : (
						<ul className="divide-y divide-gray-200 dark:divide-gray-700">
							{results.map((dog) => (
								<li
									key={dog.documentId}
									className="flex flex-wrap items-center justify-between gap-3 py-3"
								>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium">
											{dog.fullkennelname || '–'}
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Zuchtbuch: {dog.cStudBookNumber || '–'}
											{' · '}
											Chip: {dog.microchipNo || '–'}
										</p>
									</div>
									<button
										type="button"
										onClick={() => onSelect(dog)}
										className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
									>
										Übernehmen
									</button>
								</li>
							))}
						</ul>
					)}

					{query.trim() && results.length === DOG_SEARCH_MAX_RESULTS ? (
						<p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
							Maximal {DOG_SEARCH_MAX_RESULTS} Ergebnisse angezeigt.
						</p>
					) : null}
				</div>

				<div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
					<button
						type="button"
						onClick={onClose}
						className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						Schließen
					</button>
				</div>
			</div>
		</div>
	)
}

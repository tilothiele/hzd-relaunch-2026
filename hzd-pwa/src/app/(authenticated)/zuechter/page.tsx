'use client'

import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import SyncButton from '@/components/SyncButton'
import { formatPlzOrt } from '@/lib/map-strapi-breeder'
import { db, type Breeder } from '@/services/db'
import { syncBreeders } from '@/services/sync'

type SortField = 'name' | 'kennelName' | 'street' | 'plzOrt' | 'phone' | 'email'
type SortDirection = 'asc' | 'desc'

function roleLabel(role: string): string {
	if (role === 'B') return 'Züchter'
	if (role === 'S') return 'Deckrüdenbesitzer'
	return role || '–'
}

function sortValue(breeder: Breeder, field: SortField): string {
	if (field === 'plzOrt') {
		return formatPlzOrt(breeder.zip, breeder.city)
	}

	return breeder[field] || ''
}

export default function ZuechterPage() {
	const breeders = useLiveQuery(() => db.breeders.toArray())
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(25)
	const [sortField, setSortField] = useState<SortField>('kennelName')
	const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
	const [searchQuery, setSearchQuery] = useState('')
	const [roleFilter, setRoleFilter] = useState('ALL')

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
			return
		}

		setSortField(field)
		setSortDirection('asc')
	}

	const filteredBreeders = useMemo(() => {
		if (!breeders) return []

		return breeders.filter((breeder) => {
			if (roleFilter !== 'ALL' && breeder.role !== roleFilter) {
				return false
			}

			if (!searchQuery.trim()) {
				return true
			}

			const query = searchQuery.toLowerCase()
			const haystack = [
				breeder.name,
				breeder.kennelName,
				breeder.street,
				breeder.zip,
				breeder.city,
				breeder.phone,
				breeder.email,
			].join(' ').toLowerCase()

			return haystack.includes(query)
		})
	}, [breeders, roleFilter, searchQuery])

	const sortedBreeders = useMemo(() => {
		return [...filteredBreeders].sort((left, right) => {
			const leftValue = sortValue(left, sortField).toLowerCase()
			const rightValue = sortValue(right, sortField).toLowerCase()
			if (leftValue < rightValue) return sortDirection === 'asc' ? -1 : 1
			if (leftValue > rightValue) return sortDirection === 'asc' ? 1 : -1
			return 0
		})
	}, [filteredBreeders, sortDirection, sortField])

	const totalItems = sortedBreeders.length
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
	const safePage = Math.min(currentPage, totalPages)
	const paginatedBreeders = sortedBreeders.slice(
		(safePage - 1) * pageSize,
		safePage * pageSize,
	)

	const SortableHeader = ({
		field,
		label,
	}: {
		field: SortField
		label: string
	}) => (
		<th
			className="cursor-pointer px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600"
			onClick={() => handleSort(field)}
		>
			{label}
			{sortField === field ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
		</th>
	)

	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-2xl font-bold">Züchter</h1>
			<SyncButton
				sync={syncBreeders}
				idleLabel="Züchter synchronisieren"
			/>

			{!breeders ? (
				<p>Lade Daten...</p>
			) : breeders.length === 0 ? (
				<p>Keine Züchter gefunden. Bitte synchronisieren Sie die Daten.</p>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800 md:grid-cols-2">
						<div className="flex flex-col gap-1">
							<label htmlFor="breeder-search" className="text-sm font-medium">
								Suche
							</label>
							<input
								id="breeder-search"
								type="text"
								placeholder="Name, Zwinger, Ort, Telefon, E-Mail..."
								value={searchQuery}
								onChange={(event) => {
									setSearchQuery(event.target.value)
									setCurrentPage(1)
								}}
								className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<label htmlFor="breeder-role" className="text-sm font-medium">
								Rolle
							</label>
							<select
								id="breeder-role"
								value={roleFilter}
								onChange={(event) => {
									setRoleFilter(event.target.value)
									setCurrentPage(1)
								}}
								className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
							>
								<option value="ALL">Alle</option>
								<option value="B">Züchter</option>
								<option value="S">Deckrüdenbesitzer</option>
							</select>
						</div>
					</div>

					<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
						<label className="flex items-center gap-2">
							<span>Einträge</span>
							<select
								value={pageSize}
								onChange={(event) => {
									setPageSize(Number(event.target.value))
									setCurrentPage(1)
								}}
								className="rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-700"
							>
								<option value={25}>25</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						</label>
						<span>
							Gesamt: <strong>{totalItems}</strong>
						</span>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full rounded-lg bg-white text-left text-sm shadow-sm dark:bg-gray-800">
							<thead className="bg-gray-50 font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
								<tr>
									<SortableHeader field="kennelName" label="Zwingername" />
									<SortableHeader field="name" label="Name" />
									<SortableHeader field="street" label="Straße / Nr." />
									<SortableHeader field="plzOrt" label="PLZ / Ort" />
									<SortableHeader field="phone" label="Telefon" />
									<SortableHeader field="email" label="E-Mail" />
									<th className="px-4 py-3">Rolle</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
								{paginatedBreeders.map((breeder) => (
									<tr
										key={breeder.documentId}
										className="hover:bg-gray-50 dark:hover:bg-gray-700"
									>
										<td className="px-4 py-3 font-medium">
											{breeder.kennelName || '–'}
										</td>
										<td className="px-4 py-3">{breeder.name || '–'}</td>
										<td className="px-4 py-3">{breeder.street || '–'}</td>
										<td className="px-4 py-3">
											{formatPlzOrt(breeder.zip, breeder.city) || '–'}
										</td>
										<td className="px-4 py-3">{breeder.phone || '–'}</td>
										<td className="px-4 py-3">{breeder.email || '–'}</td>
										<td className="px-4 py-3">{roleLabel(breeder.role)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{totalPages > 1 && (
						<div className="mt-4 flex items-center justify-center gap-2">
							<button
								type="button"
								onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
								disabled={safePage === 1}
								className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50 dark:bg-gray-700"
							>
								Zurück
							</button>
							<span className="text-sm">
								Seite {safePage} von {totalPages}
							</span>
							<button
								type="button"
								onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
								disabled={safePage === totalPages}
								className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50 dark:bg-gray-700"
							>
								Weiter
							</button>
						</div>
					)}
				</>
			)}
		</div>
	)
}

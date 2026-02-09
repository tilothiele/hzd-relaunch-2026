'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Dog } from '@/services/db';

const farbe = (f: string) => {
    switch (f) {
        case 'SM':
            return `Schwarzmarken (${f})`;
        case 'S':
            return `Schwarz (${f})`;
        case 'B':
            return `Blond (${f})`;
        default:
            return f;
    }
}

const geschlecht = (g: string) => {
    switch (g) {
        case 'M':
            return 'Rüde';
        case 'F':
            return 'Hündin';
        default:
            return g;
    }
}

const calculateAge = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    let years = now.getFullYear() - date.getFullYear();
    let months = now.getMonth() - date.getMonth();

    if (months < 0 || (months === 0 && now.getDate() < date.getDate())) {
        years--;
        months += 12;
    }

    if (now.getDate() < date.getDate()) {
        months--;
    }
    if (months < 0) {
        months += 12;
    }

    return { years, months };
}

const formatDateAndAge = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const age = calculateAge(dateString);
    const formattedDate = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    if (!age) return formattedDate;

    return `${formattedDate} (${age.years} Jahre, ${age.months} Monate)`;
}

type SortField = keyof Dog;
type SortDirection = 'asc' | 'desc';

export default function HundePage() {
    const dogs = useLiveQuery(() => db.dogs.toArray());

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [sortField, setSortField] = useState<SortField>('fullkennelname');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [sexFilter, setSexFilter] = useState('ALL');
    const [colorFilter, setColorFilter] = useState('ALL');
    const [fertileOnly, setFertileOnly] = useState(false);
    const [onlyLiving, setOnlyLiving] = useState(true);
    const [maxAgeEnabled, setMaxAgeEnabled] = useState(false);
    const [maxAgeYears, setMaxAgeYears] = useState(8);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredDogs = useMemo(() => {
        if (!dogs) return [];
        return dogs.filter(dog => {
            // Search Query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = (dog.fullkennelname || '').toLowerCase().includes(query);
                const matchesChip = (dog.microchipNo || '').toLowerCase().includes(query);
                const matchesStud = (dog.cStudBookNumber || '').toLowerCase().includes(query);
                if (!matchesName && !matchesChip && !matchesStud) return false;
            }

            // Sex Filter
            if (sexFilter !== 'ALL') {
                if (dog.sex !== sexFilter) return false;
            }

            // Color Filter
            if (colorFilter !== 'ALL') {
                if (dog.color !== colorFilter) return false;
            }

            // Fertile Filter
            if (fertileOnly) {
                const fertile = (dog.cFertile || '').toLowerCase();
                const isFertile = fertile === 'j' || fertile === 'ja' || fertile === 'yes' || fertile === 'true' || fertile === '1';
                if (!isFertile) return false;
            }

            // Only Living Filter
            if (onlyLiving) {
                if (dog.dateofdeath) return false;
            }

            // Max Age Filter
            if (maxAgeEnabled) {
                const age = calculateAge(dog.dateofbirth);
                if (age && age.years > maxAgeYears) return false;
            }

            return true;
        });
    }, [dogs, searchQuery, sexFilter, colorFilter, fertileOnly, onlyLiving, maxAgeEnabled, maxAgeYears]);

    const sortedDogs = useMemo(() => {
        return [...filteredDogs].sort((a, b) => {
            const aValue = a[sortField] || '';
            const bValue = b[sortField] || '';

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredDogs, sortField, sortDirection]);

    const paginatedDogs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedDogs.slice(start, start + pageSize);
    }, [sortedDogs, currentPage, pageSize]);

    // Reset page when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, sexFilter, colorFilter, fertileOnly, pageSize]);

    const totalPages = Math.ceil((sortedDogs.length || 0) / pageSize);
    const totalItems = sortedDogs.length || 0;

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <span className="text-gray-400 ml-1">↕</span>;
        return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    const SortableHeader = ({ field, label }: { field: SortField, label: string }) => (
        <th
            className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center">
                {label}
                <SortIcon field={field} />
            </div>
        </th>
    );

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Hunde</h1>
            <p>Hier sehen Sie Ihre synchronisierten Hunde.</p>

            {/* Sync Alert when no dogs or loading */}
            {!dogs || dogs.length === 0 ? null : (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search Input */}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="search" className="text-sm font-medium">Suche</label>
                            <input
                                id="search"
                                type="text"
                                placeholder="Name, Chip, Zuchtbuch..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Sex Filter */}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="sexFilter" className="text-sm font-medium">Geschlecht</label>
                            <select
                                id="sexFilter"
                                value={sexFilter}
                                onChange={(e) => setSexFilter(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">Alle</option>
                                <option value="M">Rüde</option>
                                <option value="F">Hündin</option>
                            </select>
                        </div>

                        {/* Color Filter */}
                        <div className="flex flex-col gap-1">
                            <label htmlFor="colorFilter" className="text-sm font-medium">Farbe</label>
                            <select
                                id="colorFilter"
                                value={colorFilter}
                                onChange={(e) => setColorFilter(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">Alle</option>
                                <option value="S">Schwarz</option>
                                <option value="SM">Schwarzmarken</option>
                                <option value="B">Blond</option>
                            </select>
                        </div>

                        {/* Fertile Filter */}
                        <div className="flex flex-col gap-2 h-full justify-end pb-2">
                            <div className="flex items-center gap-2">
                                <input
                                    id="fertileOnly"
                                    type="checkbox"
                                    checked={fertileOnly}
                                    onChange={(e) => setFertileOnly(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label htmlFor="fertileOnly" className="text-sm font-medium select-none cursor-pointer">
                                    Nur paarungsfähig
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    id="onlyLiving"
                                    type="checkbox"
                                    checked={onlyLiving}
                                    onChange={(e) => setOnlyLiving(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label htmlFor="onlyLiving" className="text-sm font-medium select-none cursor-pointer">
                                    Nur lebende
                                </label>
                            </div>
                        </div>

                        {/* Max Age Filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Maximales Alter</label>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        id="maxAgeEnabled"
                                        type="checkbox"
                                        checked={maxAgeEnabled}
                                        onChange={(e) => setMaxAgeEnabled(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <select
                                    id="maxAgeYears"
                                    value={maxAgeYears}
                                    onChange={(e) => setMaxAgeYears(Number(e.target.value))}
                                    disabled={!maxAgeEnabled}
                                    className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {Array.from({ length: 20 }, (_, i) => i + 1).map(year => (
                                        <option key={year} value={year}>{year} Jahre</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm font-medium">Zeige:</label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                    </select>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Einträge</span>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Gesamt: <strong>{totalItems}</strong> Hunde
                </div>
            </div>

            {!dogs ? (
                <p>Lade Daten...</p>
            ) : dogs.length === 0 ? (
                <p>Keine Hunde gefunden. Bitte synchronisieren Sie die Daten.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                                <tr>
                                    <SortableHeader field="fullkennelname" label="Name" />
                                    <SortableHeader field="dateofbirth" label="Wurftag" />
                                    <th className="px-4 py-3">Chip-Nr.</th>
                                    <SortableHeader field="sex" label="Geschlecht" />
                                    <SortableHeader field="color" label="Farbe" />
                                    <th className="px-4 py-3">Besitzer</th>
                                    <th className="px-4 py-3">Zuchtbuch-Nr.</th>
                                    <th className="px-4 py-3">Paarungsfähig</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {paginatedDogs.map((dog) => (
                                    <tr key={dog.documentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{dog.fullkennelname}</td>
                                        <td className="px-4 py-3">{formatDateAndAge(dog.dateofbirth)}</td>
                                        <td className="px-4 py-3 font-mono">{dog.microchipNo}</td>
                                        <td className="px-4 py-3">
                                            {geschlecht(dog.sex)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {farbe(dog.color)}
                                        </td>
                                        <td className="px-4 py-3">{dog.ownerName}</td>
                                        <td className="px-4 py-3">{dog.cStudBookNumber}</td>
                                        <td className="px-4 py-3">{dog.cFertile}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Zurück
                            </button>
                            <span className="text-sm">
                                Seite {currentPage} von {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Weiter
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

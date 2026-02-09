'use client';

import { useState } from 'react';
import { syncDogs } from '@/services/sync';

export default function SyncButton() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);

    const handleSync = async () => {
        setLoading(true);
        setMessage('Initialisiere...');
        setProgress(0);

        const result = await syncDogs((current, total) => {
            const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
            setProgress(percentage);
            setMessage(`Synchronisiere... ${current} / ${total || '?'}`);
        });

        setLoading(false);
        setMessage(result.message);
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
            <button
                onClick={handleSync}
                disabled={loading}
                className="px-6 py-3 bg-[var(--color-kapitaensblau)] text-white rounded shadow hover:opacity-90 disabled:opacity-50 font-medium transition-colors w-full sm:w-auto"
            >
                {loading ? 'Synchronisiere...' : 'Hunde synchronisieren'}
            </button>

            {loading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            {message && <p className="text-sm text-center text-gray-700 dark:text-gray-300">{message}</p>}
        </div>
    );
}

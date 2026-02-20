import React from 'react'

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Du bist offline</h1>
            <p className="text-lg text-gray-600 mb-8">
                Es scheint, als hättest du keine Internetverbindung.
                Einige Inhalte sind möglicherweise nicht verfügbar.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                style={{ backgroundColor: '#4560AA' }}
            >
                Erneut versuchen
            </button>
        </div>
    )
}

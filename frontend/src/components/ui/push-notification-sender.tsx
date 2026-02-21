'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faMessage, faSliders, faCheck } from '@fortawesome/free-solid-svg-icons'

export function PushNotificationSender() {
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [channels, setChannels] = useState<Record<string, boolean>>({
        aktuelles: false,
        berichte: false,
        hovipedia: false,
        welpen: false,
        terminkalender: false,
        ergebnisse: false,
        notvermittlungen: false,
        testnachrichten: true
    })

    const channelLabels: Record<string, string> = {
        aktuelles: 'Aktuelles',
        berichte: 'Berichte',
        hovipedia: 'Hovipedia',
        welpen: 'Welpen',
        terminkalender: 'Terminkalender',
        ergebnisse: 'Ergebnisse',
        notvermittlungen: 'Notvermittlungen',
        testnachrichten: 'Testnachrichten'
    }

    async function sendNotification() {
        if (!message.trim()) {
            setStatus({ type: 'error', text: 'Bitte gib eine Nachricht ein.' })
            return
        }

        setIsLoading(true)
        setStatus(null)

        try {
            const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    channels
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setStatus({
                    type: 'success',
                    text: `Erfolgreich gesendet! (${data.summary.success} Erfolge, ${data.summary.failed} Fehler)`
                })
                setMessage('')
            } else {
                throw new Error(data.error || 'Senden fehlgeschlagen')
            }
        } catch (error) {
            console.error('Error sending notification:', error)
            setStatus({
                type: 'error',
                text: error instanceof Error ? error.message : 'Fehler beim Senden der Benachrichtigung.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const toggleChannel = (key: string) => {
        setChannels(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100 mt-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <FontAwesomeIcon icon={faPaperPlane} className="text-[#4560AA]" />
                Push-Benachrichtigung senden (Admin)
            </h3>

            {status && (
                <div className={`mb-6 p-4 rounded-lg text-sm font-medium border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {status.text}
                </div>
            )}

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMessage} className="text-gray-400 text-xs" />
                        Nachricht
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Deine Nachricht an die Abonnenten..."
                        className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#4560AA] focus:border-transparent resize-none text-sm transition-all"
                        disabled={isLoading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faSliders} className="text-gray-400 text-xs" />
                        Ziel-Kanäle auswählen
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(channelLabels).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => toggleChannel(key)}
                                disabled={isLoading}
                                className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${channels[key]
                                    ? 'bg-[#4560AA] border-[#4560AA] text-white shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#4560AA] hover:text-[#4560AA]'
                                    }`}
                            >
                                {label}
                                {channels[key] && <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
                            </button>
                        ))}
                    </div>
                    <p className="mt-4 text-[11px] text-gray-500 italic">
                        * Wenn kein Kanal ausgewählt ist, wird die Nachricht an ALLE Abonnenten gesendet.
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-50">
                    <button
                        onClick={sendNotification}
                        disabled={isLoading || !message.trim()}
                        className="w-full sm:w-auto px-8 py-3 bg-[#4560AA] text-white rounded-xl hover:bg-[#344a8a] transition-all font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>Wird gesendet...</>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faPaperPlane} />
                                Jetzt senden
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

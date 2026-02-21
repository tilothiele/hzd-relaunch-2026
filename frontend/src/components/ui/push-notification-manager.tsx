'use client'

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faBellSlash, faSliders, faSave } from '@fortawesome/free-solid-svg-icons'

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
    const [channels, setChannels] = useState<Record<string, boolean>>({
        aktuelles: true,
        berichte: true,
        hovipedia: true,
        welpen: true,
        terminkalender: true,
        ergebnisse: true,
        notvermittlungen: true,
        testnachrichten: false
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent)
            setIsIOS(isApple)

            // Check if app is in standalone mode (PWA)
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
            setIsStandalone(!!isInstalled)

            if ('serviceWorker' in navigator && 'PushManager' in window) {
                setIsSupported(true)
                checkSubscription()
            }
        }
    }, [])

    async function checkSubscription() {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()
        setIsSubscribed(!!sub)
        setSubscription(sub)

        if (sub) {
            // Fetch current channel settings from server
            try {
                const response = await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`)
                if (response.ok) {
                    const data = await response.json()
                    // Extract channels if they exist in the Strapi response
                    // Depending on how the API returns things, it might be in data.subscriptions[0].channels
                    const savedChannels = data.subscriptions?.[0]?.channels || data.createSubscription?.channels || data.updateSubscription?.channels
                    if (savedChannels) {
                        setChannels(prev => ({ ...prev, ...savedChannels }))
                    }
                }
            } catch (error) {
                console.error('Error fetching subscription channels:', error)
            }
        }
    }

    async function subscribe() {
        if (isIOS && !isStandalone) {
            setMessage({
                type: 'info',
                text: 'Um Benachrichtigungen auf dem iPhone zu erhalten, füge diese Seite bitte zuerst über das "Teilen"-Menü zum Home-Bildschirm hinzu.'
            })
            return
        }

        setIsLoading(true)
        setMessage(null)
        try {
            // Explicitly request permission first (required by some browsers/OS)
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                throw new Error('Benachrichtigungen wurden blockiert. Bitte erlaube sie in deinen Browsereinstellungen.')
            }

            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            })

            // Send subscription AND channels to your server
            const subPayload = {
                ...sub.toJSON(),
                channels: channels
            };

            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subPayload),
            })


            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('[PushNotificationManager] Server error data:', errorData);
                throw new Error(errorData.error || 'Failed to save subscription on server')
            }

            setSubscription(sub)
            setIsSubscribed(true)
            setMessage({ type: 'success', text: `Benachrichtigungen erfolgreich aktiviert! (${new Date().toLocaleTimeString()})` })
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error)
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Fehler beim Aktivieren der Benachrichtigungen.'
            })
        } finally {
            setIsLoading(false)
        }
    }

    async function unsubscribe() {
        setIsLoading(true)
        setMessage(null)
        if (subscription) {
            try {
                // Notify your server about the unsubscription
                await fetch('/api/notifications/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                })

                await subscription.unsubscribe()
                setSubscription(null)
                setIsSubscribed(false)
                setMessage({ type: 'success', text: 'Benachrichtigungen deaktiviert.' })
            } catch (error) {
                console.error('Failed to unsubscribe:', error)
                setMessage({ type: 'error', text: 'Fehler beim Deaktivieren der Benachrichtigungen.' })
            } finally {
                setIsLoading(false)
            }
        }
    }

    async function handleChannelChange(channelKey: string, checked: boolean) {
        setChannels(prev => ({ ...prev, [channelKey]: checked }))
    }

    async function saveSettings() {
        if (!subscription) {
            setMessage({ type: 'error', text: 'Bitte aktiviere erst die Benachrichtigungen.' })
            return
        }

        setIsLoading(true)
        setMessage(null)
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    channels: channels
                }),
            })

            if (response.ok) {
                setMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert.' })
            } else {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Speichern fehlgeschlagen')
            }
        } catch (error) {
            console.error('Error saving channel settings:', error)
            setMessage({ type: 'error', text: 'Fehler beim Speichern der Einstellungen.' })
        } finally {
            setIsLoading(false)
        }
    }

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

    if (!isSupported && !isIOS) {
        return null
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <FontAwesomeIcon icon={faBell} className="text-[#4560AA]" />
                Benachrichtigungen vom Hovawarte Zuchtverein Deutschland e.V.
            </h3>

            {message && (
                <div className={`mb-6 p-4 rounded-lg text-sm font-medium border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' :
                    message.type === 'info' ? 'bg-blue-50 text-[#4560AA] border-blue-100' :
                        'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Channels Section - Always Visible */}
            <div className="mb-8 p-5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <FontAwesomeIcon icon={faSliders} className="text-[#4560AA] text-sm" />
                        Info-Kanäle
                    </h4>
                    {isSubscribed && (
                        <button
                            onClick={saveSettings}
                            disabled={isLoading}
                            className="px-4 py-1.5 bg-[#4560AA] text-white rounded-lg hover:bg-[#344a8a] transition-colors text-xs font-bold shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <FontAwesomeIcon icon={faSave} className="text-[10px]" />
                            {isLoading ? 'Speichert...' : 'Einstellungen speichern'}
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(channelLabels).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={channels[key]}
                                    onChange={(e) => handleChannelChange(key, e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-[#4560AA] focus:ring-[#4560AA] cursor-pointer transition-all"
                                />
                            </div>
                            <span className="text-sm text-gray-700 group-hover:text-[#4560AA] transition-colors">{label}</span>
                        </label>
                    ))}
                </div>
                {!isSubscribed && (
                    <p className="mt-4 text-[11px] text-gray-500 italic">
                        * Wähle deine Themen aus und aktiviere dann die Benachrichtigungen, um sie zu speichern.
                    </p>
                )}
            </div>

            <div className="pt-6 border-t border-gray-100">
                {!isSupported && isIOS ? (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-sm text-[#4560AA] font-bold mb-2">iPhone erkannt</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            Um Benachrichtigungen auf deinem iPhone zu erhalten, musst du diese Seite zuerst zum Home-Bildschirm hinzufügen:
                        </p>
                        <ol className="mt-3 text-sm text-gray-700 list-decimal list-inside space-y-2">
                            <li>Klicke unten im Browser auf das <span className="font-bold">Teilen-Icon</span> (Quadrat mit Pfeil nach oben).</li>
                            <li>Wähle <span className="font-bold">"Zum Home-Bildschirm"</span>.</li>
                            <li>Öffne die App dann von deinem Home-Bildschirm.</li>
                        </ol>
                    </div>
                ) : isSubscribed ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Benachrichtigungen sind aktiv
                            </p>
                            <button
                                onClick={unsubscribe}
                                disabled={isLoading}
                                className="px-5 py-2 bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-red-500 hover:border-red-100 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faBellSlash} />
                                {isLoading ? 'Wird verarbeitet...' : 'Deaktivieren'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-gray-600">Erhalte wichtige Updates direkt auf dein Gerät (Handy oder Desktop).</p>
                        <button
                            onClick={subscribe}
                            disabled={isLoading}
                            className="px-8 py-3 text-white rounded-lg transition-all text-base w-fit font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 disabled:opacity-50"
                            style={{ backgroundColor: '#4560AA' }}
                        >
                            <FontAwesomeIcon icon={faBell} />
                            {isLoading ? 'Wird aktiviert...' : 'Benachrichtigungen jetzt aktivieren'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faBellSlash } from '@fortawesome/free-solid-svg-icons'

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            checkSubscription()
        }
    }, [])

    async function checkSubscription() {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()
        setIsSubscribed(!!sub)
        setSubscription(sub)
    }

    async function subscribe() {
        try {
            const registration = await navigator.serviceWorker.ready
            // In a real app, you'd fetch the public VAPID key from your server
            // For now, this is a placeholder for the logic
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            })
            setSubscription(sub)
            setIsSubscribed(true)
            console.log('Push subscription successful:', sub)
            // Send subscription to your server here
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error)
        }
    }

    async function unsubscribe() {
        if (subscription) {
            await subscription.unsubscribe()
            setSubscription(null)
            setIsSubscribed(false)
            // Notify your server about the unsubscription here
        }
    }

    if (!isSupported) {
        return null
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <FontAwesomeIcon icon={faBell} className="text-[#4560AA]" />
                Push-Benachrichtigungen
            </h3>
            {isSubscribed ? (
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-green-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Du hast Benachrichtigungen abonniert.
                    </p>
                    <button
                        onClick={unsubscribe}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm w-fit font-medium flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faBellSlash} />
                        Abbestellen
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-gray-600">Erhalte wichtige Updates direkt auf dein Gerät (Handy oder Desktop).</p>
                    <button
                        onClick={subscribe}
                        className="px-6 py-2 text-white rounded-lg transition-colors text-sm w-fit font-bold shadow-sm flex items-center gap-2"
                        style={{ backgroundColor: '#4560AA' }}
                    >
                        <FontAwesomeIcon icon={faBell} />
                        Benachrichtigungen aktivieren
                    </button>
                </div>
            )}
        </div>
    )
}

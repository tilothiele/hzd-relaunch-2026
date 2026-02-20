'use client'

import { useEffect, useState } from 'react'

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
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
            <h3 className="text-lg font-semibold mb-2">Push-Benachrichtigungen</h3>
            {isSubscribed ? (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-green-600">Du hast Benachrichtigungen abonniert.</p>
                    <button
                        onClick={unsubscribe}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm w-fit"
                    >
                        Abbestellen
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600">Erhalte wichtige Updates direkt auf dein Gerät.</p>
                    <button
                        onClick={subscribe}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm w-fit"
                        style={{ backgroundColor: '#4560AA' }}
                    >
                        Benachrichtigungen aktivieren
                    </button>
                </div>
            )}
        </div>
    )
}

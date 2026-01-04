'use client'

import { useSyncExternalStore, useCallback } from 'react'

const STORAGE_KEY = 'cookie-consent'

export type ConsentStatus = 'accepted' | 'rejected' | 'undecided'

function getSnapshot(): ConsentStatus {
    if (typeof window === 'undefined') return 'undecided'
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accepted') return 'accepted'
    if (stored === 'rejected') return 'rejected'
    return 'undecided'
}

function getServerSnapshot(): ConsentStatus {
    return 'undecided'
}

function subscribe(callback: () => void) {
    window.addEventListener('storage', callback)
    window.addEventListener('cookie-consent-updated', callback)
    return () => {
        window.removeEventListener('storage', callback)
        window.removeEventListener('cookie-consent-updated', callback)
    }
}

export function useCookieConsent() {
    const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

    const accept = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, 'accepted')
            window.dispatchEvent(new CustomEvent('cookie-consent-updated'))
        } catch (error) {
            console.error('Error saving cookie consent:', error)
        }
    }, [])

    const reject = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, 'rejected')
            window.dispatchEvent(new CustomEvent('cookie-consent-updated'))
        } catch (error) {
            console.error('Error rejecting cookies:', error)
        }
    }, [])

    return {
        status,
        isAccepted: status === 'accepted',
        isRejected: status === 'rejected',
        isUndecided: status === 'undecided',
        accept,
        reject,
    }
}

'use client'

import { useState, useEffect } from 'react'
import { openDB } from './client/db'

async function fetch_value_from_rest(badgeName: string, lastDate: string | null): Promise<number> {
    try {
        const url = new URL('/api/news-articles/newArticlesNum', window.location.origin)
        url.searchParams.append('category', badgeName)
        if (lastDate) {
            url.searchParams.append('timestamp', lastDate)
        }
        const response = await fetch(url.toString())
        if (!response.ok) return 0
        const data = await response.json()
        return data.count ?? data.value ?? 0
    } catch (e) {
        console.error('Fetch error:', e)
        return 0
    }
}

export async function getBadgeNumber(badgeName: string): Promise<number | null> {
    if (typeof window === 'undefined') return null

    try {
        const db = await openDB()

        const getFromStore = (key: string): Promise<any> => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('badgeNumbers', 'readonly')
                const store = tx.objectStore('badgeNumbers')
                const req = store.get(key)
                req.onsuccess = () => resolve(req.result)
                req.onerror = () => reject(req.error)
            })
        }

        const putToStore = (item: any): Promise<void> => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction('badgeNumbers', 'readwrite')
                const store = tx.objectStore('badgeNumbers')
                const req = store.put(item)
                req.onsuccess = () => resolve()
                req.onerror = () => reject(req.error)
            })
        }

        const metadataKey = `${badgeName}-0`
        let metadata = await getFromStore(metadataKey)
        let currId = metadata?.currId || 1

        const currentKey = `${badgeName}-${currId}`
        const currentElement = await getFromStore(currentKey)

        const now = new Date().toISOString()
        const today = now.split('T')[0]

        if (currentElement && currentElement.date.split('T')[0] === today) {
            return currentElement.value
        }

        // Not today or doesn't exist, fetch new value
        const prevDate = currentElement?.date || null
        const newValue = await fetch_value_from_rest(badgeName, prevDate)

        // If currentElement exists, we move to next ID, if it didn't exist, we stay at 1 (default)
        const nextId = currentElement ? (currId % 3) + 1 : 1

        await putToStore({ id: metadataKey, currId: nextId })
        await putToStore({ id: `${badgeName}-${nextId}`, date: now, value: newValue })

        return newValue
    } catch (error) {
        console.error('Error in getBadgeNumber:', error)
        return null
    }
}

export function useBadgeNumber(badgeName: string | null) {
    const [badgeNumber, setBadgeNumber] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!badgeName) {
            setLoading(false)
            return
        }

        let isMounted = true
        getBadgeNumber(badgeName).then((num) => {
            if (isMounted) {
                setBadgeNumber(num)
                setLoading(false)
            }
        })
        return () => {
            isMounted = false
        }
    }, [badgeName])

    return { badgeNumber, loading }
}
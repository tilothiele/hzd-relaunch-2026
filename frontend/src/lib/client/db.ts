const DB_NAME = 'hzd_news_db'
const STORE_NAME = 'read_articles'
const DB_VERSION = 1

export async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
    })
}

export async function markAsRead(id: string): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put({ id, timestamp: Date.now() })

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
    })
}

export async function getReadArticles(): Promise<Set<string>> {
    try {
        const db = await openDB()
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly')
            const store = transaction.objectStore(STORE_NAME)
            const request = store.getAll()

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                const results = request.result as { id: string }[]
                resolve(new Set(results.map((r) => r.id)))
            }
        })
    } catch (error) {
        console.error('Error getting read articles:', error)
        return new Set()
    }
}

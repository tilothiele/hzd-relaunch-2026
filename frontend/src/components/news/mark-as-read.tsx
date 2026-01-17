'use client'

import { useEffect } from 'react'
import { markAsRead } from '@/lib/client/db'

interface MarkAsReadProps {
    documentId: string
}

export function MarkAsRead({ documentId }: MarkAsReadProps) {
    useEffect(() => {
        if (documentId) {
            markAsRead(documentId).catch(console.error)
        }
    }, [documentId])

    return null
}
